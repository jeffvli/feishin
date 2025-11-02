import { queryOptions } from '@tanstack/react-query';
import isElectron from 'is-electron';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useSettingsStore } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import {
    FullLyricsMetadata,
    InternetProviderLyricResponse,
    InternetProviderLyricSearchResponse,
    LyricGetQuery,
    LyricSearchQuery,
    LyricsQuery,
    QueueSong,
    ServerType,
    StructuredLyric,
    SynchronizedLyricsArray,
} from '/@/shared/types/domain-types';
import { LyricSource } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const lyricsIpc = isElectron() ? window.api.lyrics : null;

// Match LRC lyrics format by https://github.com/ustbhuangyi/lyric-parser
// [mm:ss.SSS] text
const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]([^\n]+)(\n|$)/g;

// Match karaoke lyrics format returned by NetEase
// [SSS,???] text
const alternateTimeExp = /\[(\d*),(\d*)]([^\n]+)(\n|$)/g;

const formatLyrics = (lyrics: string) => {
    const synchronizedLines = lyrics.matchAll(timeExp);
    const formattedLyrics: SynchronizedLyricsArray = [];

    for (const line of synchronizedLines) {
        const [, minute, sec, ms, text] = line;
        const minutes = parseInt(minute, 10);
        const seconds = parseInt(sec, 10);
        const milis = ms?.length === 3 ? parseInt(ms, 10) : parseInt(ms, 10) * 10;

        const timeInMilis = (minutes * 60 + seconds) * 1000 + milis;

        formattedLyrics.push([timeInMilis, text]);
    }

    if (formattedLyrics.length > 0) return formattedLyrics;

    const alternateSynchronizedLines = lyrics.matchAll(alternateTimeExp);
    for (const line of alternateSynchronizedLines) {
        const [, timeInMilis, , text] = line;
        const cleanText = text
            .replaceAll(/\(\d+,\d+\)/g, '')
            .replaceAll(/\s,/g, ',')
            .replaceAll(/\s\./g, '.');
        formattedLyrics.push([Number(timeInMilis), cleanText]);
    }

    if (formattedLyrics.length > 0) return formattedLyrics;

    // If no synchronized lyrics were found, return the original lyrics
    return lyrics;
};

export const lyricsQueries = {
    search: (args: Omit<QueryHookArgs<LyricSearchQuery>, 'serverId'>) => {
        return queryOptions({
            gcTime: 1000 * 60 * 1,
            queryFn: () => {
                if (lyricsIpc) {
                    return lyricsIpc.searchRemoteLyrics(args.query);
                }
                return {} as Record<LyricSource, InternetProviderLyricSearchResponse[]>;
            },
            queryKey: queryKeys.songs.lyricsSearch(args.query),
            staleTime: 1000 * 60 * 1,
            ...args.options,
        });
    },
    serverLyrics: (args: QueryHookArgs<LyricsQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                // This should only be called for Jellyfin. Return null to ignore errors
                if (server.type !== ServerType.JELLYFIN) return null;
                return api.controller.getLyrics({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.songs.lyrics(args.serverId || '', args.query),
            ...args.options,
        });
    },
    songLyrics: (args: QueryHookArgs<LyricsQuery>, song: QueueSong | undefined) => {
        return queryOptions({
            gcTime: Infinity,
            queryFn: async ({ signal }): Promise<FullLyricsMetadata | null | StructuredLyric[]> => {
                const server = getServerById(song?.serverId);
                if (!server) throw new Error('Server not found');
                if (!song) return null;

                const { preferLocalLyrics } = useSettingsStore.getState().lyrics;

                let localLyrics: FullLyricsMetadata | null | StructuredLyric[] = null;
                let remoteLyrics: FullLyricsMetadata | null | StructuredLyric[] = null;

                if (hasFeature(server, ServerFeature.LYRICS_MULTIPLE_STRUCTURED)) {
                    const subsonicLyrics = await api.controller
                        .getStructuredLyrics({
                            apiClientProps: { server, signal },
                            query: { songId: song.id },
                        })
                        .catch(console.error);

                    if (subsonicLyrics?.length) {
                        localLyrics = subsonicLyrics;
                    }
                } else if (hasFeature(server, ServerFeature.LYRICS_SINGLE_STRUCTURED)) {
                    const jfLyrics = await api.controller
                        .getLyrics({
                            apiClientProps: { server, signal },
                            query: { songId: song.id },
                        })
                        .catch((err) => console.error(err));

                    if (jfLyrics) {
                        localLyrics = {
                            artist: song.artists?.[0]?.name,
                            lyrics: jfLyrics,
                            name: song.name,
                            remote: false,
                            source: server?.name ?? 'music server',
                        };
                    }
                } else if (song.lyrics) {
                    localLyrics = {
                        artist: song.artists?.[0]?.name,
                        lyrics: formatLyrics(song.lyrics),
                        name: song.name,
                        remote: false,
                        source: server?.name ?? 'music server',
                    };
                }

                if (preferLocalLyrics && localLyrics) {
                    return localLyrics;
                }

                const { fetch } = useSettingsStore.getState().lyrics;

                if (fetch) {
                    const remoteLyricsResult: InternetProviderLyricResponse | null =
                        await lyricsIpc?.getRemoteLyricsBySong(song);

                    if (remoteLyricsResult) {
                        remoteLyrics = {
                            ...remoteLyricsResult,
                            lyrics: formatLyrics(remoteLyricsResult.lyrics),
                            remote: true,
                        };
                    }
                }

                if (remoteLyrics) {
                    return remoteLyrics;
                }

                if (localLyrics) {
                    return localLyrics;
                }

                return null;
            },
            queryKey: queryKeys.songs.lyrics(args.serverId || '', args.query),
            staleTime: Infinity,
            ...args.options,
        });
    },
    songLyricsByRemoteId: (args: QueryHookArgs<Partial<LyricGetQuery>>) => {
        return queryOptions({
            queryFn: async () => {
                const remoteLyricsResult = await lyricsIpc?.getRemoteLyricsByRemoteId(
                    args.query as any,
                );

                if (remoteLyricsResult) {
                    return formatLyrics(remoteLyricsResult);
                }

                return null;
            },
            queryKey: queryKeys.songs.lyricsByRemoteId(args.query),
            ...args.options,
        });
    },
};
