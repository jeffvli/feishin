import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useCurrentServer } from '/@/renderer/store';
import { RawMusicFolderListResponse } from '/@/renderer/api/types';

export const useMusicFolders = () => {
  const server = useCurrentServer();

  const query = useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getMusicFolderList({ server, signal }),
    queryKey: queryKeys.musicFolders.list(server?.id || ''),
    select: useCallback(
      (data: RawMusicFolderListResponse | undefined) => {
        return api.normalize.musicFolderList(data, server);
      },
      [server],
    ),
  });

  return query;
};
