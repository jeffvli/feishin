import type { ICellRendererParams } from '@ag-grid-community/core';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';

export const TitleCell = ({ value }: ICellRendererParams) => {
    if (value === undefined) {
        return (
            <CellContainer position="left">
                <Skeleton
                    height="1rem"
                    width="80%"
                />
            </CellContainer>
        );
    }

    return (
        <CellContainer position="left">
            <Text
                className="current-song-child"
                overflow="hidden"
                size="md"
            >
                {value}
            </Text>
        </CellContainer>
    );
};
