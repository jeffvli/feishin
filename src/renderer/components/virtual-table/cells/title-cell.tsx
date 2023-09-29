import type { ICellRendererParams } from '@ag-grid-community/core';
import { Skeleton } from '/@/renderer/components/skeleton';
import { Text } from '/@/renderer/components/text';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';

export const TitleCell = ({ value }: ICellRendererParams) => {
    if (value === undefined) {
        return (
            <CellContainer $position="left">
                <Skeleton
                    height="1rem"
                    width="80%"
                />
            </CellContainer>
        );
    }

    return (
        <CellContainer $position="left">
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
