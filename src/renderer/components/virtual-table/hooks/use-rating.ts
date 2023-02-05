import { useQueryClient, useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { NDAlbumDetail, NDAlbumArtistDetail } from '/@/renderer/api/navidrome.types';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SSAlbumDetail, SSAlbumArtistDetail } from '/@/renderer/api/subsonic.types';
import {
  RawRatingResponse,
  RatingArgs,
  Album,
  Song,
  AlbumArtist,
  Artist,
  LibraryItem,
} from '/@/renderer/api/types';
import {
  useCurrentServer,
  useSetAlbumListItemDataById,
  useSetQueueRating,
  useAuthStore,
} from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';

export const useUpdateRating = () => {
  const queryClient = useQueryClient();
  const currentServer = useCurrentServer();
  const setAlbumListData = useSetAlbumListItemDataById();
  const setQueueRating = useSetQueueRating();

  return useMutation<
    RawRatingResponse,
    HTTPError,
    Omit<RatingArgs, 'server'>,
    { previous: { items: Album[] | Song[] | AlbumArtist[] | Artist[] } | undefined }
  >({
    mutationFn: (args) => {
      const server = useAuthStore.getState().actions.getServer(args._serverId) || currentServer;
      return api.controller.updateRating({ ...args, server });
    },
    onError: (_error, _variables, context) => {
      for (const item of context?.previous?.items || []) {
        switch (item.itemType) {
          case LibraryItem.ALBUM:
            setAlbumListData(item.id, { userRating: item.userRating });
            break;
          case LibraryItem.SONG:
            setQueueRating([item.id], item.userRating);
            break;
        }
      }
    },
    onMutate: (variables) => {
      for (const item of variables.query.item) {
        switch (item.itemType) {
          case LibraryItem.ALBUM:
            setAlbumListData(item.id, { userRating: variables.query.rating });
            break;
          case LibraryItem.SONG:
            setQueueRating([item.id], variables.query.rating);
            break;
        }
      }

      return { previous: { items: variables.query.item } };
    },
    onSuccess: (_data, variables) => {
      // We only need to set if we're already on the album detail page
      const isAlbumDetailPage =
        variables.query.item.length === 1 && variables.query.item[0].itemType === LibraryItem.ALBUM;

      if (isAlbumDetailPage) {
        const { serverType, id: albumId, serverId } = variables.query.item[0] as Album;

        const queryKey = queryKeys.albums.detail(serverId || '', { id: albumId });
        const previous = queryClient.getQueryData<any>(queryKey);
        if (previous) {
          switch (serverType) {
            case ServerType.NAVIDROME:
              queryClient.setQueryData<NDAlbumDetail>(queryKey, {
                ...previous,
                userRating: variables.query.rating,
              });
              break;
            case ServerType.SUBSONIC:
              queryClient.setQueryData<SSAlbumDetail>(queryKey, {
                ...previous,
                userRating: variables.query.rating,
              });
              break;
            case ServerType.JELLYFIN:
              // Jellyfin does not support ratings
              break;
          }
        }
      }

      // We only need to set if we're already on the album detail page
      const isAlbumArtistDetailPage =
        variables.query.item.length === 1 &&
        variables.query.item[0].itemType === LibraryItem.ALBUM_ARTIST;

      if (isAlbumArtistDetailPage) {
        const { serverType, id: albumArtistId, serverId } = variables.query.item[0] as AlbumArtist;

        const queryKey = queryKeys.albumArtists.detail(serverId || '', {
          id: albumArtistId,
        });
        const previous = queryClient.getQueryData<any>(queryKey);
        if (previous) {
          switch (serverType) {
            case ServerType.NAVIDROME:
              queryClient.setQueryData<NDAlbumArtistDetail>(queryKey, {
                ...previous,
                userRating: variables.query.rating,
              });
              break;
            case ServerType.SUBSONIC:
              queryClient.setQueryData<SSAlbumArtistDetail>(queryKey, {
                ...previous,
                userRating: variables.query.rating,
              });
              break;
            case ServerType.JELLYFIN:
              // Jellyfin does not support ratings
              break;
          }
        }
      }
    },
  });
};
