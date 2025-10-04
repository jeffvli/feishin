import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const DefaultColumn = (props: ItemTableListInnerColumn) => {
    const row: any | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string') {
        return <TableColumnTextContainer {...props}>{row}</TableColumnTextContainer>;
    }

    if (typeof row === 'undefined') {
        return (
            <TableColumnTextContainer {...props}>
                <Skeleton />
            </TableColumnTextContainer>
        );
    }

    return <TableColumnTextContainer {...props}>&nbsp;</TableColumnTextContainer>;
};
