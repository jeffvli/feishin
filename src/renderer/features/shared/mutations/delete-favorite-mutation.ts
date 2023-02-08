import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { JFAlbumArtistDetail, JFAlbumDetail } from '/@/renderer/api/jellyfin.types';
import { NDAlbumArtistDetail, NDAlbumDetail } from '/@/renderer/api/navidrome.types';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SSAlbumArtistDetail, SSAlbumDetail } from '/@/renderer/api/subsonic.types';
import { FavoriteArgs, LibraryItem, RawFavoriteResponse, ServerType } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import {
  useCurrentServer,
  useSetAlbumListItemDataById,
  useSetQueueFavorite,
} from '/@/renderer/store';

export const useDeleteFavorite = (options?: MutationOptions) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const setAlbumListData = useSetAlbumListItemDataById();
  const setQueueFavorite = useSetQueueFavorite();

  return useMutation<RawFavoriteResponse, HTTPError, Omit<FavoriteArgs, 'server'>, null>({
    mutationFn: (args) => api.controller.deleteFavorite({ ...args, server }),
    onSuccess: (_data, variables) => {
      for (const id of variables.query.id) {
        // Set the userFavorite property to false for the album in the album list data store
        if (variables.query.type === LibraryItem.ALBUM) {
          setAlbumListData(id, { userFavorite: false });
        }
      }

      if (variables.query.type === LibraryItem.SONG) {
        setQueueFavorite(variables.query.id, false);
      }

      // We only need to set if we're already on the album detail page
      if (variables.query.type === LibraryItem.ALBUM && variables.query.id.length === 1) {
        const queryKey = queryKeys.albums.detail(server?.id || '', { id: variables.query.id[0] });
        const previous = queryClient.getQueryData<any>(queryKey);

        if (previous) {
          switch (server?.type) {
            case ServerType.NAVIDROME:
              queryClient.setQueryData<NDAlbumDetail>(queryKey, {
                ...previous,
                starred: false,
              });
              break;
            case ServerType.SUBSONIC:
              queryClient.setQueryData<SSAlbumDetail>(queryKey, {
                ...previous,
                starred: false,
              });
              break;
            case ServerType.JELLYFIN:
              queryClient.setQueryData<JFAlbumDetail>(queryKey, {
                ...previous,
                UserData: {
                  ...previous.UserData,
                  IsFavorite: false,
                },
              });
              break;
          }
        }
      }

      // We only need to set if we're already on the album detail page
      if (variables.query.type === LibraryItem.ALBUM_ARTIST && variables.query.id.length === 1) {
        const queryKey = queryKeys.albumArtists.detail(server?.id || '', {
          id: variables.query.id[0],
        });
        const previous = queryClient.getQueryData<any>(queryKey);

        if (previous) {
          switch (server?.type) {
            case ServerType.NAVIDROME:
              queryClient.setQueryData<NDAlbumArtistDetail>(queryKey, {
                ...previous,
                starred: false,
              });
              break;
            case ServerType.SUBSONIC:
              queryClient.setQueryData<SSAlbumArtistDetail>(queryKey, {
                ...previous,
                starred: false,
              });
              break;
            case ServerType.JELLYFIN:
              queryClient.setQueryData<JFAlbumArtistDetail>(queryKey, {
                ...previous,
                UserData: {
                  ...previous.UserData,
                  IsFavorite: false,
                },
              });
              break;
          }
        }
      }
    },
    ...options,
  });
};
