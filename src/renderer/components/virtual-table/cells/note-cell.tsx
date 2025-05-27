import type { ICellRendererParams } from '@ag-grid-community/core';

import { useMemo } from 'react';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';

export const NoteCell = ({ value }: ICellRendererParams) => {
    const formattedValue = useMemo(() => {
        if (!value) {
            return '';
        }

        return replaceURLWithHTMLLinks(value);
    }, [value]);

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
                isMuted
                overflow="hidden"
            >
                {formattedValue}
            </Text>
        </CellContainer>
    );
};
