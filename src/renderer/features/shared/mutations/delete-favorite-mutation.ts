import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    AlbumArtistDetailResponse,
    AlbumDetailResponse,
    FavoriteArgs,
    FavoriteResponse,
    LibraryItem,
} from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useSetAlbumListItemDataById, useSetQueueFavorite } from '/@/renderer/store';
import isElectron from 'is-electron';
import { useFavoriteEvent } from '/@/renderer/store/event.store';

const remote = isElectron() ? window.electron.remote : null;

export const useDeleteFavorite = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();
    const setAlbumListData = useSetAlbumListItemDataById();
    const setQueueFavorite = useSetQueueFavorite();
    const setFavoriteEvent = useFavoriteEvent();

    return useMutation<
        FavoriteResponse,
        AxiosError,
        Omit<FavoriteArgs, 'server' | 'apiClientProps'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.deleteFavorite({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            const { serverId } = variables;

            if (!serverId) return;

            for (const id of variables.query.id) {
                // Set the userFavorite property to false for the album in the album list data store
                if (variables.query.type === LibraryItem.ALBUM) {
                    setAlbumListData(id, { userFavorite: false });
                }
            }

            if (variables.query.type === LibraryItem.SONG) {
                remote?.updateFavorite(false, serverId, variables.query.id);
                setQueueFavorite(variables.query.id, false);
                setFavoriteEvent(variables.query.id, false);
            }

            // We only need to set if we're already on the album detail page
            if (variables.query.type === LibraryItem.ALBUM && variables.query.id.length === 1) {
                const queryKey = queryKeys.albums.detail(serverId, { id: variables.query.id[0] });
                const previous = queryClient.getQueryData<AlbumDetailResponse>(queryKey);

                if (previous) {
                    queryClient.setQueryData<AlbumDetailResponse>(queryKey, {
                        ...previous,
                        userFavorite: false,
                    });
                }
            }

            // We only need to set if we're already on the album artist detail page
            if (
                variables.query.type === LibraryItem.ALBUM_ARTIST &&
                variables.query.id.length === 1
            ) {
                const queryKey = queryKeys.albumArtists.detail(serverId, {
                    id: variables.query.id[0],
                });
                const previous = queryClient.getQueryData<AlbumArtistDetailResponse>(queryKey);

                if (previous) {
                    queryClient.setQueryData<AlbumArtistDetailResponse>(queryKey, {
                        ...previous,
                        userFavorite: false,
                    });
                }
            }
        },
        ...options,
    });
};
