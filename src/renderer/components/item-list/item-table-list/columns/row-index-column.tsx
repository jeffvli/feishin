import clsx from 'clsx';
import { memo } from 'react';

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
        case LibraryItem.FOLDER:
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG:
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
        startRowIndex,
    } = props;

    let adjustedRowIndex =
        adjustedRowIndexMap?.get(rowIndex) ?? (enableHeader ? rowIndex : rowIndex + 1);

    if (startRowIndex !== undefined && adjustedRowIndex > 0) {
        adjustedRowIndex = startRowIndex + adjustedRowIndex;
    }

    if (enableExpansion) {
        return (
            <TableColumnContainer {...props}>
                <ActionIcon
                    className={clsx(styles.expand, 'hover-only')}
                    icon="arrowDownS"
                    iconProps={{ color: 'muted', size: 'md' }}
                    onClick={(e) => {
                        const item = data[rowIndex] as ItemListItem;
                        const rowId = internalState.extractRowId(item);
                        const index = rowId ? internalState.findItemIndex(rowId) : -1;
                        controls.onExpand?.({
                            event: e,
                            index,
                            internalState,
                            item,
                            itemType,
                        });
                    }}
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
    const isActive =
        !!props.activeRowId &&
        (props.activeRowId === song?.id || props.activeRowId === song?._uniqueId);

    const isActiveAndPlaying = isActive && status === PlayerStatus.PLAYING;

    let adjustedRowIndex =
        props.adjustedRowIndexMap?.get(props.rowIndex) ??
        (props.enableHeader ? props.rowIndex : props.rowIndex + 1);

    if (props.startRowIndex !== undefined && adjustedRowIndex > 0) {
        adjustedRowIndex = props.startRowIndex + adjustedRowIndex;
    }

    return (
        <InnerQueueSongRowIndexColumn
            {...props}
            adjustedRowIndex={adjustedRowIndex}
            isActive={isActive}
            isPlaying={isActiveAndPlaying}
        />
    );
};

const InnerQueueSongRowIndexColumn = memo(
    (
        props: ItemTableListInnerColumn & {
            adjustedRowIndex: number;
            isActive: boolean;
            isPlaying: boolean;
        },
    ) => {
        return (
            <TableColumnTextContainer {...props}>
                {props.isActive ? (
                    props.isPlaying ? (
                        <Flex>
                            <Icon fill="primary" icon="mediaPlay" />
                        </Flex>
                    ) : (
                        <Flex>
                            <Icon fill="primary" icon="mediaPause" />
                        </Flex>
                    )
                ) : (
                    props.adjustedRowIndex
                )}
            </TableColumnTextContainer>
        );
    },
);
