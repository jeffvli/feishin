/* eslint-disable import/no-cycle */
import type { ICellRendererParams } from '@ag-grid-community/core';
import { Rating } from '/@/renderer/components/rating';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useSetRating } from '/@/renderer/features/shared';

export const RatingCell = ({ value, node }: ICellRendererParams) => {
    const updateRatingMutation = useSetRating({});

    const handleUpdateRating = (rating: number) => {
        updateRatingMutation.mutate(
            {
                query: {
                    item: [value],
                    rating,
                },
                serverId: value?.serverId,
            },
            {
                onSuccess: () => {
                    node.setData({ ...node.data, userRating: rating });
                },
            },
        );
    };

    return (
        <CellContainer $position="center">
            <Rating
                size="xs"
                value={value?.userRating}
                onChange={handleUpdateRating}
            />
        </CellContainer>
    );
};
