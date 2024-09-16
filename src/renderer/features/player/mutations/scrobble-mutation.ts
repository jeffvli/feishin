import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '/@/renderer/api';
import { ScrobbleResponse, ScrobbleArgs } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { getServerById, useIncrementQueuePlayCount } from '/@/renderer/store';
import { usePlayEvent } from '/@/renderer/store/event.store';

export const useSendScrobble = (options?: MutationOptions) => {
    const incrementPlayCount = useIncrementQueuePlayCount();
    const sendPlayEvent = usePlayEvent();

    return useMutation<
        ScrobbleResponse,
        AxiosError,
        Omit<ScrobbleArgs, 'server' | 'apiClientProps'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.scrobble({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            // Manually increment the play count for the song in the queue if scrobble was submitted
            if (variables.query.submission) {
                incrementPlayCount([variables.query.id]);
                sendPlayEvent(variables.query.id);
            }
        },
        ...options,
    });
};
