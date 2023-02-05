import { MouseEvent, useState } from 'react';
import type { ICellRendererParams } from '@ag-grid-community/core';
import { Rating } from '/@/renderer/components/rating';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useUpdateRating } from '/@/renderer/components/virtual-table/hooks/use-rating';

export const RatingCell = ({ value }: ICellRendererParams) => {
  const updateRatingMutation = useUpdateRating();
  const [ratingValue, setRatingValue] = useState(value?.userRating);

  const handleUpdateRating = (rating: number) => {
    if (!value) return;

    updateRatingMutation.mutate({
      _serverId: value?.serverId,
      query: {
        item: [value],
        rating,
      },
    });

    setRatingValue(rating);
  };

  const handleClearRating = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    updateRatingMutation.mutate({
      _serverId: value?.serverId,
      query: {
        item: [value],
        rating: 0,
      },
    });

    setRatingValue(0);
  };

  return (
    <CellContainer position="center">
      <Rating
        defaultValue={value?.userRating || 0}
        size="xs"
        value={ratingValue}
        onChange={handleUpdateRating}
        onClick={handleClearRating}
      />
    </CellContainer>
  );
};
