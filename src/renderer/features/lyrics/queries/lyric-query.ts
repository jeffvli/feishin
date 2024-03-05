import { UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    LyricsQuery,
    QueueSong,
    SynchronizedLyricsArray,
    InternetProviderLyricResponse,
    FullLyricsMetadata,
    LyricGetQuery,
    StructuredLyric,
    ServerType,
} from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useLyricsSettings } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { api } from '/@/renderer/api';
import isElectron from 'is-electron';
import { hasFeature } from '/@/renderer/api/utils';
import { ServerFeature } from '/@/renderer/api/features.types';

const lyricsIpc = isElectron() ? window.electron.lyrics : null;

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

export const useServerLyrics = (
    args: QueryHookArgs<LyricsQuery>,
): UseQueryResult<string | null> => {
    const { query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        // Note: This currently fetches for every song, even if it shouldn't have
        // lyrics, because for some reason HasLyrics is not exposed. Thus, ignore the error
        onError: () => {},
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            // This should only be called for Jellyfin. Return null to ignore errors
            if (server.type !== ServerType.JELLYFIN) return null;
            return api.controller.getLyrics({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.songs.lyrics(server?.id || '', query),
    });
};

export const useSongLyricsBySong = (
    args: QueryHookArgs<LyricsQuery>,
    song: QueueSong | undefined,
): UseQueryResult<FullLyricsMetadata | StructuredLyric[]> => {
    const { query } = args;
    const { fetch } = useLyricsSettings();
    const server = getServerById(song?.serverId);

    return useQuery({
        cacheTime: Infinity,
        enabled: !!song && !!server,
        onError: () => {},
        queryFn: async ({ signal }): Promise<FullLyricsMetadata | StructuredLyric[] | null> => {
            if (!server) throw new Error('Server not found');
            if (!song) return null;

            if (hasFeature(server, ServerFeature.MULTIPLE_STRUCTURED_LYRICS)) {
                const subsonicLyrics = await api.controller
                    .getStructuredLyrics({
                        apiClientProps: { server, signal },
                        query: { songId: song.id },
                    })
                    .catch(console.error);

                if (subsonicLyrics) {
                    return subsonicLyrics;
                }
            } else if (hasFeature(server, ServerFeature.SINGLE_STRUCTURED_LYRIC)) {
                const jfLyrics = await api.controller
                    .getLyrics({
                        apiClientProps: { server, signal },
                        query: { songId: song.id },
                    })
                    .catch((err) => console.log(err));

                if (jfLyrics) {
                    return {
                        artist: song.artists?.[0]?.name,
                        lyrics: jfLyrics,
                        name: song.name,
                        remote: false,
                        source: server?.name ?? 'music server',
                    };
                }
            } else if (song.lyrics) {
                return {
                    artist: song.artists?.[0]?.name,
                    lyrics: formatLyrics(song.lyrics),
                    name: song.name,
                    remote: false,
                    source: server?.name ?? 'music server',
                };
            }

            if (fetch) {
                const remoteLyricsResult: InternetProviderLyricResponse | null =
                    await lyricsIpc?.getRemoteLyricsBySong(song);

                if (remoteLyricsResult) {
                    return {
                        ...remoteLyricsResult,
                        lyrics: formatLyrics(remoteLyricsResult.lyrics),
                        remote: true,
                    };
                }
            }

            return null;
        },
        queryKey: queryKeys.songs.lyrics(server?.id || '', query),
        staleTime: Infinity,
    });
};

export const useSongLyricsByRemoteId = (
    args: QueryHookArgs<Partial<LyricGetQuery>>,
): UseQueryResult<string | null> => {
    const queryClient = useQueryClient();
    const { query, serverId } = args;

    return useQuery({
        enabled: !!query.remoteSongId && !!query.remoteSource,
        onError: () => {},
        onSuccess: (data) => {
            if (!data || !query.song) {
                return;
            }

            const lyricsResult = {
                artist: query.song.artists?.[0]?.name,
                lyrics: data,
                name: query.song.name,
                remote: false,
                source: query.remoteSource,
            };

            queryClient.setQueryData(
                queryKeys.songs.lyrics(serverId, { songId: query.song.id }),
                lyricsResult,
            );
        },
        queryFn: async () => {
            const remoteLyricsResult = await lyricsIpc?.getRemoteLyricsByRemoteId(
                query as LyricGetQuery,
            );

            if (remoteLyricsResult) {
                return formatLyrics(remoteLyricsResult);
            }

            return null;
        },
        queryKey: queryKeys.songs.lyricsByRemoteId(query),
    });
};
