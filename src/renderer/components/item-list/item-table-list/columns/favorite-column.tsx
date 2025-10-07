import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
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
                        color: row ? 'primary' : 'muted',
                        fill: row ? 'primary' : undefined,
                    }}
                    size="lg"
                    variant="transparent"
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
