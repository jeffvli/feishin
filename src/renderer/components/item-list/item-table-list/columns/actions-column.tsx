import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const ActionsColumn = (props: ItemTableListInnerColumn) => {
    const row: any = (props.data as (any | undefined)[])[props.rowIndex];

    const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (row !== undefined) {
            props.controls.onMore?.({
                event,
                internalState: props.internalState,
                item: row as ItemListItem,
                itemType: props.itemType,
            });
        }
    };

    const handleActionDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
    };

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
                    onClick={handleActionClick}
                    onDoubleClick={handleActionDoubleClick}
                    size="xs"
                    variant="subtle"
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
