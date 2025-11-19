import clsx from 'clsx';

import styles from './row-index-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { usePlayerStatus } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export const RowIndexColumn = (props: ItemTableListInnerColumn) => {
    const { itemType } = props;

    switch (itemType) {
        case LibraryItem.QUEUE_SONG:
            return <QueueSongRowIndexColumn {...props} />;
        default:
            return <DefaultRowIndexColumn {...props} />;
    }
};

const DefaultRowIndexColumn = (props: ItemTableListInnerColumn) => {
    const {
        adjustedRowIndexMap,
        controls,
        data,
        enableExpansion,
        enableHeader,
        internalState,
        itemType,
        rowIndex,
    } = props;

    const adjustedRowIndex =
        adjustedRowIndexMap?.get(rowIndex) ?? (enableHeader ? rowIndex : rowIndex + 1);

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
                            internalState,
                            item: data[rowIndex] as ItemListItem,
                            itemType,
                        })
                    }
                    size="xs"
                    variant="subtle"
                />
                <Text className="hide-on-hover" isMuted isNoSelect>
                    {adjustedRowIndex}
                </Text>
            </TableColumnContainer>
        );
    }

    return <TableColumnTextContainer {...props}>{adjustedRowIndex}</TableColumnTextContainer>;
};

const QueueSongRowIndexColumn = (props: ItemTableListInnerColumn) => {
    const status = usePlayerStatus();
    const song = props.data[props.rowIndex] as QueueSong;
    const isActive = props.activeRowId === song?._uniqueId;

    const adjustedRowIndex =
        props.adjustedRowIndexMap?.get(props.rowIndex) ??
        (props.enableHeader ? props.rowIndex : props.rowIndex + 1);

    return (
        <TableColumnTextContainer {...props}>
            {isActive ? (
                status === PlayerStatus.PLAYING ? (
                    <Flex>
                        <Icon fill="primary" icon="mediaPlay" />
                    </Flex>
                ) : (
                    <Flex>
                        <Icon fill="primary" icon="mediaPause" />
                    </Flex>
                )
            ) : (
                adjustedRowIndex
            )}
        </TableColumnTextContainer>
    );
};
