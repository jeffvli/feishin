import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  Album,
  AlbumArtist,
  AnyLibraryItems,
  LibraryItem,
  SetRatingArgs,
  RatingResponse,
  AlbumDetailResponse,
  AlbumArtistDetailResponse,
} from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useSetAlbumListItemDataById, useSetQueueRating } from '/@/renderer/store';

export const useSetRating = (args: MutationHookArgs) => {
  const { options } = args || {};
  const queryClient = useQueryClient();
  const setAlbumListData = useSetAlbumListItemDataById();
  const setQueueRating = useSetQueueRating();

  return useMutation<
    RatingResponse,
    HTTPError,
    Omit<SetRatingArgs, 'server' | 'apiClientProps'>,
    { previous: { items: AnyLibraryItems } | undefined }
  >({
    mutationFn: (args) => {
      const server = getServerById(args.serverId);
      if (!server) throw new Error('Server not found');
      return api.controller.updateRating({ ...args, apiClientProps: { server } });
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
        const { id: albumId, serverId } = variables.query.item[0] as Album;

        const queryKey = queryKeys.albums.detail(serverId || '', { id: albumId });
        const previous = queryClient.getQueryData<AlbumDetailResponse>(queryKey);
        if (previous) {
          queryClient.setQueryData<AlbumDetailResponse>(queryKey, {
            ...previous,
            userRating: variables.query.rating,
          });
        }
      }

      // We only need to set if we're already on the album artist detail page
      const isAlbumArtistDetailPage =
        variables.query.item.length === 1 &&
        variables.query.item[0].itemType === LibraryItem.ALBUM_ARTIST;

      if (isAlbumArtistDetailPage) {
        const { id: albumArtistId, serverId } = variables.query.item[0] as AlbumArtist;

        const queryKey = queryKeys.albumArtists.detail(serverId || '', {
          id: albumArtistId,
        });
        const previous = queryClient.getQueryData<AlbumArtistDetailResponse>(queryKey);
        if (previous) {
          queryClient.setQueryData<AlbumArtistDetailResponse>(queryKey, {
            ...previous,
            userRating: variables.query.rating,
          });
        }
      }
    },
    ...options,
  });
};
