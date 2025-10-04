import formatDuration from 'format-duration';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const DurationColumn = (props: ItemTableListInnerColumn) => {
    const row: number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'number') {
        return <TableColumnContainer {...props}>{formatDuration(row)}</TableColumnContainer>;
    }

    return (
        <TableColumnContainer {...props}>
            <Skeleton />
        </TableColumnContainer>
    );
};
