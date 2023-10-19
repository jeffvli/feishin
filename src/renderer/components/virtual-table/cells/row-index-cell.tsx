import type { ICellRendererParams } from '@ag-grid-community/core';
import { Text } from '/@/renderer/components/text';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';

export const RowIndexCell = ({ value }: ICellRendererParams) => {
    return (
        <CellContainer $position="right">
            <Text
                $secondary
                align="right"
                className="current-song-child current-song-index"
                overflow="hidden"
                size="md"
            >
                {value}
            </Text>
        </CellContainer>
    );
};
