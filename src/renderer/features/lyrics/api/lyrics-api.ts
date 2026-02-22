import { queryOptions } from '@tanstack/react-query';
import isElectron from 'is-electron';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { queryClient, QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useSettingsStore } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import {
    FullLyricsMetadata,
    InternetProviderLyricResponse,
    InternetProviderLyricSearchResponse,
    LyricGetQuery,
    LyricSearchQuery,
    LyricsOverride,
    LyricsQuery,
    QueueSong,
    Song,
    StructuredLyric,
    SynchronizedLyricsArray,
} from '/@/shared/types/domain-types';
import { LyricSource } from '/@/shared/types/domain-types';
import { LyricsResponse } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const lyricsIpc = isElectron() ? window.api.lyrics : null;

export type LyricsQueryResult = {
    local: FullLyricsMetadata | null | StructuredLyric[];
    overrideData: LyricsResponse | null;
    overrideSelection: LyricsOverride | null;
    remoteAuto: FullLyricsMetadata | null;
    selected: FullLyricsMetadata | null | StructuredLyric;
    selectedOffsetMs: number;
    selectedStructuredIndex: number;
    selectedSynced: boolean;
    suppressRemoteAuto: boolean;
};

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

export const formatLyricsForDisplay = formatLyrics;

export function computeSelectedFromResult(
    result: Pick<
        LyricsQueryResult,
        'local' | 'overrideData' | 'overrideSelection' | 'remoteAuto' | 'selectedOffsetMs'
    >,
    preferLocalLyrics: boolean,
    selectedStructuredIndex: number,
): {
    selected: FullLyricsMetadata | null | StructuredLyric;
    selectedSynced: boolean;
} {
    const { local, overrideData, overrideSelection, remoteAuto, selectedOffsetMs } = result;

    // Override takes precedence over local and remote lyrics in all scenarios if available
    if (overrideSelection && overrideData) {
        const overrideLyrics: FullLyricsMetadata = {
            artist: overrideSelection.artist,
            lyrics: overrideData,
            name: overrideSelection.name,
            offsetMs: selectedOffsetMs,
            remote: overrideSelection.remote ?? true,
            source: overrideSelection.source,
        };
        return {
            selected: overrideLyrics,
            selectedSynced: Array.isArray(overrideData),
        };
    }

    const hasLocalLocal =
        (Array.isArray(local) && local.length > 0) ||
        (local != null && !Array.isArray(local) && 'lyrics' in local && Boolean(local.lyrics));

    // If setting is set to prefer local lyrics, return the local lyrics if available
    if (preferLocalLyrics && hasLocalLocal) {
        if (Array.isArray(local) && local.length > 0) {
            const item = local[Math.min(selectedStructuredIndex, local.length - 1)];
            return { selected: item, selectedSynced: item.synced };
        }

        if (local != null && !Array.isArray(local) && 'lyrics' in local && local.lyrics) {
            return { selected: local, selectedSynced: Array.isArray(local.lyrics) };
        }
    }

    // If remote lyrics are automatically fetched and available, return the remote auto lyrics
    if (remoteAuto) {
        return {
            selected: remoteAuto,
            selectedSynced: Array.isArray(remoteAuto.lyrics),
        };
    }

    // Otherwise, we just return the local lyrics if available, using structured lyrics if available
    if (Array.isArray(local) && local.length > 0) {
        const item = local[Math.min(selectedStructuredIndex, local.length - 1)];
        return { selected: item, selectedSynced: item.synced };
    }

    if (local != null && !Array.isArray(local) && 'lyrics' in local && local.lyrics) {
        return { selected: local, selectedSynced: Array.isArray(local.lyrics) };
    }

    // If no lyrics are available, return null
    return { selected: null, selectedSynced: false };
}

export async function fetchLocalLyrics(params: {
    serverId: string;
    signal?: AbortSignal;
    song: QueueSong;
}): Promise<FullLyricsMetadata | null | StructuredLyric[]> {
    const { serverId, signal, song } = params;
    const server = getServerById(serverId);
    if (!server) throw new Error('Server not found');

    if (hasFeature(server, ServerFeature.LYRICS_MULTIPLE_STRUCTURED)) {
        const subsonicLyrics = await api.controller
            .getStructuredLyrics({
                apiClientProps: { serverId, signal },
                query: { songId: song.id },
            })
            .catch(console.error);
        if (subsonicLyrics?.length) return subsonicLyrics;
    } else if (hasFeature(server, ServerFeature.LYRICS_SINGLE_STRUCTURED)) {
        const jfLyrics = await api.controller
            .getLyrics({
                apiClientProps: { serverId, signal },
                query: { songId: song.id },
            })
            .catch((err) => console.error(err));
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
    return null;
}

export async function fetchRemoteLyricsAuto(song: QueueSong): Promise<FullLyricsMetadata | null> {
    const { fetch } = useSettingsStore.getState().lyrics;
    if (!fetch) return null;
    const remoteLyricsResult: InternetProviderLyricResponse | null =
        await lyricsIpc?.getRemoteLyricsBySong(song);

    if (remoteLyricsResult) {
        return {
            ...remoteLyricsResult,
            lyrics: formatLyrics(remoteLyricsResult.lyrics),
            remote: true,
        };
    }
    return null;
}

export async function fetchRemoteLyricsById(params: {
    remoteSongId: string;
    remoteSource: LyricSource;
    song?: QueueSong | Song;
}): Promise<LyricsResponse | null> {
    const result = await lyricsIpc?.getRemoteLyricsByRemoteId(params as LyricGetQuery);
    if (result) return formatLyrics(result);
    return null;
}

export function getDisplayOffset(
    selected: FullLyricsMetadata | null | StructuredLyric,
    storedOffsetMs: number,
    selectedStructuredIndex: number,
    local: FullLyricsMetadata | null | StructuredLyric[],
): number {
    if (selected && 'offsetMs' in selected && selected.offsetMs !== undefined) {
        return selected.offsetMs;
    }

    if (Array.isArray(local) && local.length > 0) {
        const item = local[Math.min(selectedStructuredIndex, local.length - 1)];
        return item.offsetMs ?? storedOffsetMs;
    }

    return storedOffsetMs;
}

const emptyResult = (): LyricsQueryResult => ({
    local: null,
    overrideData: null,
    overrideSelection: null,
    remoteAuto: null,
    selected: null,
    selectedOffsetMs: 0,
    selectedStructuredIndex: 0,
    selectedSynced: false,
    suppressRemoteAuto: false,
});

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
    songLyrics: (args: QueryHookArgs<LyricsQuery>, song: QueueSong | undefined) => {
        const lyricsKey = queryKeys.songs.lyrics(args.serverId, args.query);
        return queryOptions({
            gcTime: Infinity,
            queryFn: async ({ signal }): Promise<LyricsQueryResult> => {
                if (!song) return emptyResult();

                const prev = queryClient.getQueryData<LyricsQueryResult>(lyricsKey);
                const overrideSelection = prev?.overrideSelection ?? null;
                const suppressRemoteAuto = prev?.suppressRemoteAuto ?? false;
                const selectedStructuredIndex = prev?.selectedStructuredIndex ?? 0;
                const selectedOffsetMs = prev?.selectedOffsetMs ?? 0;
                const preferLocalLyrics = useSettingsStore.getState().lyrics.preferLocalLyrics;

                // Fetch local lyrics
                const localPromise = fetchLocalLyrics({ serverId: args.serverId, signal, song });

                // Fetch remote auto lyrics
                const remoteAutoPromise =
                    suppressRemoteAuto || !useSettingsStore.getState().lyrics.fetch
                        ? null
                        : fetchRemoteLyricsAuto(song);

                // Fetch override data
                const overrideDataPromise = overrideSelection
                    ? fetchRemoteLyricsById({
                          remoteSongId: overrideSelection.id,
                          remoteSource: overrideSelection.source as LyricSource,
                          song,
                      })
                    : null;

                const [local, remoteAuto, overrideData] = await Promise.all([
                    localPromise,
                    remoteAutoPromise,
                    overrideDataPromise,
                ]);

                const partial: Pick<
                    LyricsQueryResult,
                    | 'local'
                    | 'overrideData'
                    | 'overrideSelection'
                    | 'remoteAuto'
                    | 'selectedOffsetMs'
                > = {
                    local,
                    overrideData,
                    overrideSelection,
                    remoteAuto,
                    selectedOffsetMs,
                };
                const { selected, selectedSynced } = computeSelectedFromResult(
                    partial,
                    preferLocalLyrics,
                    selectedStructuredIndex,
                );
                const displayOffset = getDisplayOffset(
                    selected,
                    selectedOffsetMs,
                    selectedStructuredIndex,
                    local,
                );
                const resultSelectedOffsetMs = displayOffset;

                return {
                    ...emptyResult(),
                    ...partial,
                    selected,
                    selectedOffsetMs: resultSelectedOffsetMs,
                    selectedStructuredIndex,
                    selectedSynced,
                    suppressRemoteAuto,
                };
            },
            queryKey: lyricsKey,
            staleTime: Infinity,
            ...args.options,
        });
    },
    songLyricsByRemoteId: (args: QueryHookArgs<Partial<LyricGetQuery>>) => {
        return queryOptions({
            gcTime: Infinity,
            queryFn: async () => {
                const q = args.query;
                if (!q?.remoteSongId || !q?.remoteSource) return null;
                return fetchRemoteLyricsById({
                    remoteSongId: q.remoteSongId,
                    remoteSource: q.remoteSource as LyricSource,
                    song: q.song as QueueSong | Song | undefined,
                });
            },
            queryKey: queryKeys.songs.lyricsByRemoteId(args.query),
            staleTime: Infinity,
            ...args.options,
        });
    },
};
