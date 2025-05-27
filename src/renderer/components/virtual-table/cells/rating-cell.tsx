import type { ICellRendererParams } from '@ag-grid-community/core';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useSetRating } from '/@/renderer/features/shared';
import { Rating } from '/@/shared/components/rating/rating';

export const RatingCell = ({ node, value }: ICellRendererParams) => {
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
        <CellContainer position="center">
            <Rating
                onChange={handleUpdateRating}
                size="xs"
                value={value?.userRating}
            />
        </CellContainer>
    );
};
