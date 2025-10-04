import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Genre } from '/@/shared/types/domain-types';

export const GenreColumn = (props: ItemTableListInnerColumn) => {
    const row: Genre[] | undefined = (props.data as (Genre[] | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (Array.isArray(row)) {
        return (
            <TableColumnContainer {...props}>
                {row.map((genre) => genre?.name).join(', ')}
            </TableColumnContainer>
        );
    }

    return null;
};
