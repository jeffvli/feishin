import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';
import { MusicFolderListQuery } from '../../../api/types';
import { QueryHookArgs } from '../../../lib/react-query';

export const useMusicFolders = (args: QueryHookArgs<MusicFolderListQuery>) => {
    const { options, serverId } = args || {};
    const server = getServerById(serverId);

    const query = useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getMusicFolderList({ apiClientProps: { server, signal } });
        },
        queryKey: queryKeys.musicFolders.list(server?.id || ''),
        ...options,
    });

    return query;
};
