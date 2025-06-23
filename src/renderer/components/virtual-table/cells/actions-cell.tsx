import type { ICellRendererParams } from '@ag-grid-community/core';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const ActionsCell = ({ api, context }: ICellRendererParams) => {
    return (
        <CellContainer position="center">
            <ActionIcon
                icon="ellipsisHorizontal"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    context.onCellContextMenu(undefined, api, e);
                }}
                size="sm"
                variant="subtle"
            />
        </CellContainer>
    );
};
