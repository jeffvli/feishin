import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { api } from '/@/renderer/api';
import { isNativeApp } from '/@/renderer/features/sour/mobile/android';
import { offlineUrl } from '/@/renderer/features/sour/mobile/offline';
import { phoneTranscode } from '/@/renderer/features/sour/mobile/phone-store';
import { TranscodingConfig } from '/@/renderer/store';
import { QueueSong } from '/@/shared/types/domain-types';

export function useSongUrl(
    song: QueueSong | undefined,
    current: boolean,
    transcodeSetting: Partial<TranscodingConfig>,
): string | undefined {
    // Android: data saver on mobile data, and saved offline copies (see features/sour/mobile)
    const transcode = isNativeApp() ? phoneTranscode(transcodeSetting) : transcodeSetting;
    const offline = offlineUrl(song);
    const prior = useRef(['', '']);
    const shouldReusePrior = Boolean(
        song?._serverId && current && prior.current[0] === song._uniqueId && prior.current[1],
    );

    const { data: queryStreamUrl } = useQuery({
        enabled: Boolean(song?._serverId) && !shouldReusePrior,
        queryFn: () =>
            api.controller.getStreamUrl({
                apiClientProps: { serverId: song!._serverId },
                query: {
                    bitrate: transcode.bitrate,
                    format: transcode.format,
                    id: song!.id,
                    maxSampleRate: transcode.maxSampleRate,
                    transcode: transcode.enabled ?? false,
                },
            }),
        queryKey: [
            song?._serverId,
            'stream-url',
            song?.id,
            shouldReusePrior ? 'reuse-prior' : transcode.bitrate,
            shouldReusePrior ? 'reuse-prior' : transcode.format,
            shouldReusePrior ? 'reuse-prior' : transcode.maxSampleRate,
            shouldReusePrior ? 'reuse-prior' : transcode.enabled,
        ] as const,
        staleTime: 60 * 1000,
    });

    useEffect(() => {
        if (!song?._serverId) {
            prior.current = ['', ''];
            return;
        }

        if (!queryStreamUrl) {
            return;
        }

        // Save resolved URL to avoid restarting current track on transcode setting changes.
        prior.current = [song._uniqueId, queryStreamUrl];
    }, [song?._serverId, song?._uniqueId, queryStreamUrl]);

    useEffect(() => {
        if (!song?._serverId) {
            prior.current = ['', ''];
        }
    }, [song?._serverId]);

    return offline ?? (shouldReusePrior ? prior.current[1] : queryStreamUrl);
}

export const getSongUrl = async (
    song: QueueSong,
    transcode: Partial<TranscodingConfig>,
    skipAutoTranscode?: boolean,
    forRenderer?: boolean,
    startTime?: number,
) => {
    const offline = offlineUrl(song);
    if (offline) return offline;
    if (isNativeApp()) transcode = phoneTranscode(transcode);
    const url = await api.controller.getStreamUrl({
        apiClientProps: { serverId: song._serverId },
        query: {
            bitrate: transcode.bitrate,
            container: song.container,
            format: transcode.format,
            forRenderer,
            id: song.id,
            maxSampleRate: transcode.maxSampleRate,
            sampleRate: song.sampleRate,
            skipAutoTranscode,
            startTime,
            transcode: transcode.enabled ?? false,
        },
    });

    return url;
};
