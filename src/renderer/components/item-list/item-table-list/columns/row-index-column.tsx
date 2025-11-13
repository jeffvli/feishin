import clsx from 'clsx';

import styles from './row-index-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Text } from '/@/shared/components/text/text';

export const RowIndexColumn = (props: ItemTableListInnerColumn) => {
    const { controls, enableExpansion } = props;

    if (enableExpansion) {
        return (
            <TableColumnContainer {...props}>
                <ActionIcon
                    className={clsx(styles.expand, 'hover-only')}
                    icon="arrowDownS"
                    iconProps={{ color: 'muted', size: 'md' }}
                    onClick={(e) =>
                        controls.onExpand?.({
                            event: e,
                            internalState: props.internalState,
                            item: props.data[props.rowIndex] as ItemListItem,
                            itemType: props.itemType,
                        })
                    }
                    size="xs"
                    variant="subtle"
                />
                <Text className="hide-on-hover" isMuted isNoSelect>
                    {props.rowIndex}
                </Text>
            </TableColumnContainer>
        );
    }

    return <TableColumnTextContainer {...props}>{props.rowIndex}</TableColumnTextContainer>;
};
