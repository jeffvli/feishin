import clsx from 'clsx';

import styles from './row-index-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { useIsActiveRow } from '/@/renderer/components/item-list/item-table-list/item-table-list-context';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { usePlayerStatus } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const RowIndexColumnBase = (props: ItemTableListInnerColumn) => {
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

export const RowIndexColumn = RowIndexColumnBase;

const DefaultRowIndexColumn = (props: ItemTableListInnerColumn) => {
    const {
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
        props.getAdjustedRowIndex?.(rowIndex) ??
        props.adjustedRowIndexMap?.get(rowIndex) ??
        (enableHeader ? rowIndex : rowIndex + 1);

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
                        e.stopPropagation();
                        const item = (props.getRowItem?.(rowIndex) ??
                            data[rowIndex]) as ItemListItem;
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
    const song = (props.getRowItem?.(props.rowIndex) ?? props.data[props.rowIndex]) as QueueSong;
    const isActive = useIsActiveRow(song?.id, song?._uniqueId);

    const isActiveAndPlaying = isActive && status === PlayerStatus.PLAYING;

    let adjustedRowIndex =
        props.getAdjustedRowIndex?.(props.rowIndex) ??
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

const InnerQueueSongRowIndexColumn = (
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
};
