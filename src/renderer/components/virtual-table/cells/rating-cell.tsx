import { MouseEvent } from 'react';
import type { ICellRendererParams } from '@ag-grid-community/core';
import { Rating } from '/@/renderer/components/rating';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useUpdateRating } from '/@/renderer/components/virtual-table/hooks/use-rating';

export const RatingCell = ({ value, node }: ICellRendererParams) => {
  const updateRatingMutation = useUpdateRating();

  const handleUpdateRating = (rating: number) => {
    if (!value) return;

    updateRatingMutation.mutate(
      {
        _serverId: value?.serverId,
        query: {
          item: [value],
          rating,
        },
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
        _serverId: value?.serverId,
        query: {
          item: [value],
          rating: 0,
        },
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
