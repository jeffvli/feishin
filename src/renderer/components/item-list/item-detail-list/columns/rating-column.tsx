import { ItemDetailListCellProps } from './types';

import { useIsMutatingRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { Rating } from '/@/shared/components/rating/rating';
import { LibraryItem } from '/@/shared/types/domain-types';

export const RatingColumn = ({ controls, internalState, song }: ItemDetailListCellProps) => {
    const isMutatingRating = useIsMutatingRating();
    const value = song.userRating ?? 0;

    return (
        <Rating
            onChange={(rating) => {
                const index = internalState?.findItemIndex(song.id) ?? -1;
                controls?.onRating?.({
                    event: null,
                    index,
                    internalState: internalState ?? undefined,
                    item: song,
                    itemType: LibraryItem.SONG,
                    rating,
                });
            }}
            readOnly={isMutatingRating}
            size="xs"
            value={value}
        />
    );
};
