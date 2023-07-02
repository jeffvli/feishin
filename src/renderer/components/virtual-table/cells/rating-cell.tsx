/* eslint-disable import/no-cycle */
import { MouseEvent } from 'react';
import type { ICellRendererParams } from '@ag-grid-community/core';
import { Rating } from '/@/renderer/components/rating';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useSetRating } from '/@/renderer/features/shared';

export const RatingCell = ({ value, node }: ICellRendererParams) => {
    const updateRatingMutation = useSetRating({});

    const handleUpdateRating = (rating: number) => {
        if (!value) return;

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

    const handleClearRating = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        updateRatingMutation.mutate(
            {
                query: {
                    item: [value],
                    rating: 0,
                },
                serverId: value?.serverId,
            },
            {
                onSuccess: () => {
                    node.setData({ ...node.data, userRating: 0 });
                },
            },
        );
    };

    return (
        <CellContainer position="center">
            <Rating
                size="xs"
                value={value?.userRating}
                onChange={handleUpdateRating}
                onClick={handleClearRating}
            />
        </CellContainer>
    );
};
