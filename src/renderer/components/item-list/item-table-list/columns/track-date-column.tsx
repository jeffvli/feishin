import { useMemo } from 'react';

import {
    ColumnNullFallback,
    ColumnSkeletonFixed,
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { formatPartialIsoDateUTC } from '/@/renderer/utils/format';

const TrackDateColumnBase = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: string | undefined = (rowItem as any)?.[props.columns[props.columnIndex].id];

    const dateDisplay = useMemo(
        () => (typeof row === 'string' && row ? formatPartialIsoDateUTC(row) : null),
        [row],
    );

    if (dateDisplay !== null) {
        return <TableColumnTextContainer {...props}>{dateDisplay}</TableColumnTextContainer>;
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonFixed {...props} />;
};

export const TrackDateColumn = TrackDateColumnBase;
