import type { ICellRendererParams } from '@ag-grid-community/core';

import { RiMoreFill } from 'react-icons/ri';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { Button } from '/@/shared/components/button/button';

export const ActionsCell = ({ api, context }: ICellRendererParams) => {
    return (
        <CellContainer position="center">
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    context.onCellContextMenu(undefined, api, e);
                }}
                size="compact-md"
                variant="subtle"
            >
                <RiMoreFill />
            </Button>
        </CellContainer>
    );
};
