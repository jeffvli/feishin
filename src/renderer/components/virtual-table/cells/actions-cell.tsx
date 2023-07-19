import type { ICellRendererParams } from '@ag-grid-community/core';
import { RiMoreFill } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';

export const ActionsCell = ({ context, api }: ICellRendererParams) => {
    return (
        <CellContainer position="center">
            <Button
                compact
                variant="subtle"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    context.onCellContextMenu(undefined, api, e);
                }}
            >
                <RiMoreFill />
            </Button>
        </CellContainer>
    );
};
