import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { api } from '/@/renderer/api';
import { TranscodingConfig, useDownloadedSong, useDownloadsStore } from '/@/renderer/store';
import { QueueSong } from '/@/shared/types/domain-types';
import { downloadKey } from '/@/shared/types/downloads';

const localUrlFor = (serverId: string, songId: string) =>
    `feishin-local://song/${encodeURIComponent(serverId)}/${encodeURIComponent(songId)}`;

export function useSongUrl(
    song: QueueSong | undefined,
    current: boolean,
    transcode: Partial<TranscodingConfig>,
): string | undefined {
    const prior = useRef(['', '']);
    const downloaded = useDownloadedSong(song?._serverId, song?.id);

    const shouldReusePrior = Boolean(
        song?._serverId && current && prior.current[0] === song._uniqueId && prior.current[1],
    );

    const useLocal = Boolean(downloaded && song?._serverId);

    const { data: queryStreamUrl } = useQuery({
        enabled: Boolean(song?._serverId) && !shouldReusePrior && !useLocal,
        queryFn: () =>
            api.controller.getStreamUrl({
                apiClientProps: { serverId: song!._serverId },
                query: {
                    bitrate: transcode.bitrate,
                    format: transcode.format,
                    id: song!.id,
                    transcode: transcode.enabled ?? false,
                },
            }),
        queryKey: [
            song?._serverId,
            'stream-url',
            song?.id,
            shouldReusePrior ? 'reuse-prior' : transcode.bitrate,
            shouldReusePrior ? 'reuse-prior' : transcode.format,
            shouldReusePrior ? 'reuse-prior' : transcode.enabled,
        ] as const,
        staleTime: 60 * 1000,
    });

    const resolvedRemote = shouldReusePrior ? prior.current[1] : queryStreamUrl;
    const finalUrl = useLocal ? localUrlFor(song!._serverId, song!.id) : resolvedRemote;

    useEffect(() => {
        if (!song?._serverId) {
            prior.current = ['', ''];
            return;
        }
        if (!finalUrl) return;
        prior.current = [song._uniqueId, finalUrl];
    }, [song?._serverId, song?._uniqueId, finalUrl]);

    useEffect(() => {
        if (!song?._serverId) {
            prior.current = ['', ''];
        }
    }, [song?._serverId]);

    return finalUrl;
}

export const getSongUrl = async (
    song: QueueSong,
    transcode: Partial<TranscodingConfig>,
    skipAutoTranscode?: boolean,
) => {
    const downloaded = useDownloadsStore.getState().songs[downloadKey(song._serverId, song.id)];
    if (downloaded?.absolutePath) {
        return downloaded.absolutePath;
    }

    const url = await api.controller.getStreamUrl({
        apiClientProps: { serverId: song._serverId },
        query: {
            bitrate: transcode.bitrate,
            format: transcode.format,
            id: song.id,
            skipAutoTranscode,
            transcode: transcode.enabled ?? false,
        },
    });

    return url;
};
