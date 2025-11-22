import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { LibraryItem, RatingResponse, SetRatingArgs } from '/@/shared/types/domain-types';

const setRatingQueryKey = ['set-rating'];

export const useSetRating = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        RatingResponse,
        AxiosError,
        SetRatingArgs,
        { previous: undefined | { id: string[]; rating: number; type: LibraryItem } }
    >({
        mutationFn: (args) => {
            return api.controller.setRating({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        mutationKey: setRatingQueryKey,
        onError: (_error, variables) => {
            eventEmitter.emit('USER_RATING', {
                id: variables.query.id,
                itemType: variables.query.type,
                rating: variables.query.rating,
                serverId: variables.apiClientProps.serverId,
            });
        },
        onMutate: (variables) => {
            eventEmitter.emit('USER_RATING', {
                id: variables.query.id,
                itemType: variables.query.type,
                rating: variables.query.rating,
                serverId: variables.apiClientProps.serverId,
            });

            return { previous: undefined };
        },
        onSuccess: (_data, variables) => {
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

export const useIsMutatingRating = () => {
    const mutatingCount = useIsMutating({ mutationKey: setRatingQueryKey });
    return mutatingCount > 0;
};
