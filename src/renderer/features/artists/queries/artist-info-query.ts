import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumArtistDetailQuery } from '/@/renderer/api/types';
import { getServerById } from '/@/renderer/store';
import { api } from '/@/renderer/api';
import { QueryHookArgs } from '../../../lib/react-query';

export const useAlbumArtistInfo = (args: QueryHookArgs<AlbumArtistDetailQuery>) => {
  const { options, query, serverId } = args || {};
  const server = getServerById(serverId);

  return useQuery({
    enabled: !!server?.id && !!query.id,
    queryFn: ({ signal }) => {
      if (!server) throw new Error('Server not found');
      return api.controller.getAlbumArtistDetail({ apiClientProps: { server, signal }, query });
    },
    queryKey: queryKeys.albumArtists.detail(server?.id || '', query),
    ...options,
  });
};
