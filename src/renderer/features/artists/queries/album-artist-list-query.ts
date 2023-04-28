import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumArtistListQuery } from '/@/renderer/api/types';
import { getServerById } from '/@/renderer/store';
import { api } from '/@/renderer/api';
import { QueryHookArgs } from '../../../lib/react-query';

export const useAlbumArtistList = (args: QueryHookArgs<AlbumArtistListQuery>) => {
  const { options, query, serverId } = args || {};
  const server = getServerById(serverId);

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => {
      if (!server) throw new Error('Server not found');
      api.controller.getAlbumArtistList({ apiClientProps: { server, signal }, query });
    },
    queryKey: queryKeys.albumArtists.list(server?.id || '', query),
    ...options,
  });
};
