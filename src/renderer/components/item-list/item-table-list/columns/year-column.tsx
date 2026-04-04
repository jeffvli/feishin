import { useMemo } from 'react';

import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { SEPARATOR_STRING } from '/@/shared/api/utils';

const YearColumnBase = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const item = rowItem as any;

    const yearDisplay = useMemo(() => {
        if (item && 'releaseYear' in item && item.releaseYear != null) {
            const releaseYear = item.releaseYear;
            const originalYear =
                'originalYear' in item && item.originalYear > 0 ? item.originalYear : null;

            if (originalYear !== null && originalYear !== releaseYear) {
                return `${originalYear}${SEPARATOR_STRING}${releaseYear}`;
            }

            if (typeof releaseYear === 'number') {
                return releaseYear;
            }
        }
        return null;
    }, [item]);

    if (yearDisplay !== null) {
        return <TableColumnTextContainer {...props}>{yearDisplay}</TableColumnTextContainer>;
    }

    const row: number | undefined = (rowItem as any)?.[props.columns[props.columnIndex].id];

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const YearColumn = YearColumnBase;
