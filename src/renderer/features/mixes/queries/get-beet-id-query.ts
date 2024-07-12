import { useQuery } from '@tanstack/react-query';
import type { GetBeetTrackQuery } from '/@/renderer/api/types';
import { ndController } from '/@/renderer/api/navidrome/navidrome-controller';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getPublicServer } from '/@/renderer/store';

export const useBeetTrack = (args: QueryHookArgs<GetBeetTrackQuery>) => {
    const { options, query, serverId } = args;
    const server = getPublicServer();

    return useQuery({
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return ndController.getBeetTrack({ apiClientProps: { server, signal }, query });
        },
        queryKey: [serverId, 'id', query],
        ...options,
    });
};
