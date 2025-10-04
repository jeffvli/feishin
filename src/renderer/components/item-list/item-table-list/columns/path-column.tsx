import {
    ItemTableListInnerColumn,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

export const PathColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'string' && row) {
        const maxLength = 50;
        const displayPath = row.length > maxLength ? `...${row.slice(-maxLength + 3)}` : row;

        return <TableColumnTextContainer {...props}>{displayPath}</TableColumnTextContainer>;
    }

    return (
        <TableColumnTextContainer {...props}>
            <Skeleton />
        </TableColumnTextContainer>
    );
};
