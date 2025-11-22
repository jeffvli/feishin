import { useMemo, useRef } from 'react';

import { api } from '/@/renderer/api';
import { TranscodingConfig } from '/@/renderer/store';
import { QueueSong } from '/@/shared/types/domain-types';

export function useSongUrl(
    song: QueueSong | undefined,
    current: boolean,
    transcode: TranscodingConfig,
): string | undefined {
    const prior = useRef(['', '']);

    return useMemo(() => {
        if (song?._serverId) {
            // If we are the current track, we do not want a transcoding
            // reconfiguration to force a restart.
            if (current && prior.current[0] === song._uniqueId) {
                return prior.current[1];
            }

            const url = api.controller.getStreamUrl({
                apiClientProps: { serverId: song._serverId },
                query: {
                    bitrate: transcode.bitrate,
                    format: transcode.format,
                    id: song.id,
                    transcode: transcode.enabled,
                },
            });

            // transcoding enabled; save the updated result
            prior.current = [song._uniqueId, url];
            return url;
        }

        // no track; clear result
        prior.current = ['', ''];
        return undefined;
    }, [
        song?._serverId,
        song?._uniqueId,
        song?.id,
        current,
        transcode.bitrate,
        transcode.format,
        transcode.enabled,
    ]);
}
