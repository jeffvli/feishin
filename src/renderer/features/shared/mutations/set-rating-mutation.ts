import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { LibraryItem, RatingResponse, SetRatingArgs } from '/@/shared/types/domain-types';

export const useSetRating = (args: MutationHookArgs) => {
    const { options } = args || {};

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
        onSuccess: (_data, variables) => {
            eventEmitter.emit('USER_RATING', {
                id: variables.query.id,
                itemType: variables.query.type,
                rating: variables.query.rating,
                serverId: variables.apiClientProps.serverId,
            });
        },
        ...options,
    });
};
