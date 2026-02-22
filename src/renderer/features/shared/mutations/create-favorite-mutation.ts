import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import {
    applyFavoriteOptimisticUpdates,
    PreviousQueryData,
    restoreFavoriteQueryData,
} from '/@/renderer/features/shared/mutations/favorite-optimistic-updates';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { toast } from '/@/shared/components/toast/toast';
import { FavoriteArgs, FavoriteResponse, LibraryItem } from '/@/shared/types/domain-types';

const remote = isElectron() ? window.api.remote : null;

const createFavoriteMutationKey = ['set-favorite', true];

export const useCreateFavorite = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation<FavoriteResponse, AxiosError, FavoriteArgs, PreviousQueryData[]>({
        mutationFn: (args) => {
            return api.controller.createFavorite({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        mutationKey: createFavoriteMutationKey,
        onError: (_error, variables, context) => {
            if (context) {
                restoreFavoriteQueryData(queryClient, context);
            }

            toast.show({
                message: _error.message,
                title: t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                type: 'error',
            });

            eventEmitter.emit('USER_FAVORITE', {
                favorite: false,
                id: variables.query.id,
                itemType: variables.query.type,
                serverId: variables.apiClientProps.serverId,
            });
        },
        onMutate: (variables) => {
            eventEmitter.emit('USER_FAVORITE', {
                favorite: true,
                id: variables.query.id,
                itemType: variables.query.type,
                serverId: variables.apiClientProps.serverId,
            });

            return applyFavoriteOptimisticUpdates(queryClient, variables, true);
        },
        onSuccess: (_data, variables) => {
            if (variables.query.type === LibraryItem.SONG) {
                remote?.updateFavorite(true, variables.apiClientProps.serverId, variables.query.id);
            }
            if (
                variables.query.type === LibraryItem.SONG ||
                variables.query.type === LibraryItem.PLAYLIST_SONG ||
                variables.query.type === LibraryItem.QUEUE_SONG
            ) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.albumArtists.favoriteSongs(
                        variables.apiClientProps.serverId,
                    ),
                });
            }
        },
        ...options,
    });
};

export const useIsMutatingCreateFavorite = () => {
    const mutatingCount = useIsMutating({ mutationKey: createFavoriteMutationKey });
    return mutatingCount > 0;
};
