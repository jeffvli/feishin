import { useCallback, useRef } from 'react';

import { useSetRatingMutation } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { LibraryItem } from '/@/shared/types/domain-types';

export const useSetRating = () => {
    const setRatingMutation = useSetRatingMutation({});

    const setRatingMutationRef = useRef(setRatingMutation);
    setRatingMutationRef.current = setRatingMutation;

    const setRating = useCallback(
        (serverId: string, id: string[], itemType: LibraryItem, rating: number) => {
            setRatingMutationRef.current.mutate({
                apiClientProps: { serverId },
                query: { id, rating, type: itemType },
            });
        },
        [],
    );

    return setRating;
};
