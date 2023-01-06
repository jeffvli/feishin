import type { ICellRendererParams } from '@ag-grid-community/core';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';

export const FavoriteCell = ({ value }: ICellRendererParams) => {
  return (
    <CellContainer position="center">
      <Button
        compact
        variant="subtle"
      >
        {!value ? <RiHeartLine /> : <RiHeartFill />}
      </Button>
    </CellContainer>
  );
};
