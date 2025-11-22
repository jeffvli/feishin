import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import isElectron from 'is-electron';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { useFavoriteEvent } from '/@/renderer/store/event.store';
import { FavoriteArgs, FavoriteResponse, LibraryItem } from '/@/shared/types/domain-types';

const remote = isElectron() ? window.api.remote : null;

const deleteFavoriteQueryKey = ['set-favorite', false];

export const useDeleteFavorite = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();
    const setFavoriteEvent = useFavoriteEvent();
    return useMutation<FavoriteResponse, AxiosError, FavoriteArgs, null>({
        mutationFn: (args) => {
            return api.controller.deleteFavorite({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        mutationKey: deleteFavoriteQueryKey,
        onError: (_error, variables) => {
            eventEmitter.emit('USER_FAVORITE', {
                favorite: true,
                id: variables.query.id,
                itemType: variables.query.type,
                serverId: variables.apiClientProps.serverId,
            });
        },
        onMutate: (variables) => {
            eventEmitter.emit('USER_FAVORITE', {
                favorite: false,
                id: variables.query.id,
                itemType: variables.query.type,
                serverId: variables.apiClientProps.serverId,
            });

            return null;
        },
        onSuccess: (_data, variables) => {
            if (variables.query.type === LibraryItem.SONG) {
                remote?.updateFavorite(
                    false,
                    variables.apiClientProps.serverId,
                    variables.query.id,
                );
                setFavoriteEvent(variables.query.id, false);
            }

            switch (variables.query.type) {
                case LibraryItem.ALBUM: {
                    const queryKey = queryKeys.albums.detail(variables.apiClientProps.serverId);
                    queryClient.invalidateQueries({
                        exact: false,
                        queryKey,
                    });

                    break;
                }
                case LibraryItem.ALBUM_ARTIST: {
                    const queryKey = queryKeys.albumArtists.detail(
                        variables.apiClientProps.serverId,
                    );

                    queryClient.invalidateQueries({
                        exact: false,
                        queryKey,
                    });

                    break;
                }
                case LibraryItem.ARTIST: {
                    const queryKey = queryKeys.artists.detail(variables.apiClientProps.serverId);

                    queryClient.invalidateQueries({
                        exact: false,
                        queryKey,
                    });

                    break;
                }
                case LibraryItem.SONG: {
                    const queryKey = queryKeys.songs.detail(variables.apiClientProps.serverId);

                    queryClient.invalidateQueries({
                        exact: false,
                        queryKey,
                    });

                    break;
                }
            }
        },
        ...options,
    });
};

export const useIsMutatingDeleteFavorite = () => {
    const mutatingCount = useIsMutating({ mutationKey: deleteFavoriteQueryKey });
    return mutatingCount > 0;
};
