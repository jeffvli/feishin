import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { Icon } from '/@/shared/components/icon/icon';

export const ActionsColumn = (props: ItemTableListInnerColumn) => {
    const row: any = (props.data as (any | undefined)[])[props.rowIndex];

    if (row !== undefined) {
        return (
            <TableColumnContainer {...props}>
                <Icon icon="ellipsisHorizontal" size="sm" />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
