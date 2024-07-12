import { useQuery } from '@tanstack/react-query';
import type { TrackListQuery } from '/@/renderer/api/types';
import { iderController } from '/@/renderer/api/ider/ider-controller';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useTrackList = (args: QueryHookArgs<TrackListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return iderController.getTrackList({ apiClientProps: { server, signal }, query });
        },
        queryKey: [serverId || '', 'track_id', query],
        ...options,
    });
};
