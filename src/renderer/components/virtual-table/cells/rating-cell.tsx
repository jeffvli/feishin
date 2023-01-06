import type { ICellRendererParams } from '@ag-grid-community/core';
import { Rating } from '/@/renderer/components/rating';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';

export const RatingCell = ({ value }: ICellRendererParams) => {
  return (
    <CellContainer position="center">
      <Rating
        size="xs"
        value={value}
      />
    </CellContainer>
  );
};
