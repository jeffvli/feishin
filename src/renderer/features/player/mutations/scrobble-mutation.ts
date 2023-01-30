import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { RawScrobbleResponse, ScrobbleArgs } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer, useIncrementQueuePlayCount } from '/@/renderer/store';

export const useSendScrobble = (options?: MutationOptions) => {
  const server = useCurrentServer();
  const incrementPlayCount = useIncrementQueuePlayCount();

  return useMutation<RawScrobbleResponse, HTTPError, Omit<ScrobbleArgs, 'server'>, null>({
    mutationFn: (args) => api.controller.scrobble({ ...args, server }),
    onSuccess: (_data, variables) => {
      // Manually increment the play count for the song in the queue if scrobble was submitted
      if (variables.query.submission) {
        incrementPlayCount([variables.query.id]);
      }
    },
    ...options,
  });
};
