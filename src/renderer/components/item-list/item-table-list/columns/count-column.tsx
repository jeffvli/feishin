import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const CountColumn = (props: ItemTableListInnerColumn) => {
    const row: number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'number') {
        return (
            <TableColumnTextContainer {...props}>{row.toLocaleString()}</TableColumnTextContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
