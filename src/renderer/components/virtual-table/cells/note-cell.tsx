import type { ICellRendererParams } from '@ag-grid-community/core';
import { Skeleton } from '/@/renderer/components/skeleton';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useMemo } from 'react';
import { Text } from '/@/renderer/components/text';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';

export const NoteCell = ({ value }: ICellRendererParams) => {
    const formattedValue = useMemo(() => {
        if (!value) {
            return '';
        }

        return replaceURLWithHTMLLinks(value);
    }, [value]);

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
                $secondary
                overflow="hidden"
            >
                {formattedValue}
            </Text>
        </CellContainer>
    );
};
