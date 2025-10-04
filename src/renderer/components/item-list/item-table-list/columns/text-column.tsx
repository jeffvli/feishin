import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const TextColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string' && row) {
        const maxLength = 100;
        const displayText = row.length > maxLength ? `${row.slice(0, maxLength)}...` : row;

        return <TableColumnTextContainer {...props}>{displayText}</TableColumnTextContainer>;
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
