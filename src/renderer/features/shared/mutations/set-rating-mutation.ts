import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { PreviousQueryData } from '/@/renderer/features/shared/mutations/favorite-optimistic-updates';
import {
    applyRatingOptimisticUpdates,
    restoreRatingQueryData,
} from '/@/renderer/features/shared/mutations/rating-optimistic-updates';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, RatingResponse, SetRatingArgs } from '/@/shared/types/domain-types';

const setRatingMutationKey = ['set-rating'];

export const useSetRatingMutation = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation<RatingResponse, AxiosError, SetRatingArgs, PreviousQueryData[]>({
        mutationFn: (args) => {
            return api.controller.setRating({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        mutationKey: setRatingMutationKey,
        onError: (_error, _variables, context) => {
            if (context) {
                restoreRatingQueryData(queryClient, context);
            }

            toast.show({
                message: _error.message,
                title: t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                type: 'error',
            });

            eventEmitter.emit('USER_RATING', {
                id: _variables.query.id,
                itemType: _variables.query.type,
                rating: _variables.query.rating,
                serverId: _variables.apiClientProps.serverId,
            });
        },
        onMutate: (variables) => {
            eventEmitter.emit('USER_RATING', {
                id: variables.query.id,
                itemType: variables.query.type,
                rating: variables.query.rating,
                serverId: variables.apiClientProps.serverId,
            });

            return applyRatingOptimisticUpdates(queryClient, variables, variables.query.rating);
        },
        onSuccess: (_data, variables) => {
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

export const useIsMutatingRating = () => {
    const mutatingCount = useIsMutating({ mutationKey: setRatingMutationKey });
    return mutatingCount > 0;
};
