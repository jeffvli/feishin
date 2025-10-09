import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const ActionsColumn = (props: ItemTableListInnerColumn) => {
    const row: any = (props.data as (any | undefined)[])[props.rowIndex];

    if (row !== undefined) {
        return (
            <TableColumnContainer {...props}>
                <ActionIcon
                    className="hover-only"
                    icon="ellipsisHorizontal"
                    iconProps={{
                        color: 'muted',
                        size: 'md',
                    }}
                    size="xs"
                    variant="subtle"
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
