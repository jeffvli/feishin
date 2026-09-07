import { useMemo } from 'react';

import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';

const YearColumnBase = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const item = rowItem as any;

    const yearDisplay = useMemo(() => {
        if (item && 'year' in item && item.year != null) {
            const year = item.year;
            if (typeof year === 'number') {
                return year;
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
