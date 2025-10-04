import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const DefaultColumn = (props: ItemTableListInnerColumn) => {
    const row: any | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        return <TableColumnContainer {...props}>{row}</TableColumnContainer>;
    }

    if (typeof row === 'undefined') {
        return (
            <TableColumnContainer {...props}>
                <Skeleton />
            </TableColumnContainer>
        );
    }

    return null;
};
