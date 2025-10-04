import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Icon } from '/@/shared/components/icon/icon';

export const FavoriteColumn = (props: ItemTableListInnerColumn) => {
    const row: boolean | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'boolean') {
        return (
            <TableColumnContainer {...props}>
                <Icon fill={row ? 'primary' : undefined} icon={'favorite'} size="md" />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
