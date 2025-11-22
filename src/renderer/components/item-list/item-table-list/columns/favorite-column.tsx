import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const FavoriteColumn = (props: ItemTableListInnerColumn) => {
    const row: boolean | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    if (typeof row === 'boolean') {
        return (
            <TableColumnContainer {...props}>
                <ActionIcon
                    className={row ? undefined : 'hover-only'}
                    icon="favorite"
                    iconProps={{
                        color: row ? 'favorite' : 'muted',
                        fill: row ? 'favorite' : undefined,
                        size: 'md',
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        props.controls.onFavorite?.({
                            event,
                            favorite: !row,
                            internalState: props.internalState,
                            item: props.data[props.rowIndex] as ItemListItem,
                            itemType: props.itemType,
                        });
                    }}
                    onDoubleClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                    size="xs"
                    variant="subtle"
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
