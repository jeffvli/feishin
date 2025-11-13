import clsx from 'clsx';

import styles from './row-index-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { useIsCurrentSong } from '/@/renderer/features/player/hooks/use-is-current-song';
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

const QueueSongRowIndexColumn = (props: ItemTableListInnerColumn) => {
    const status = usePlayerStatus();
    const { isActive } = useIsCurrentSong(props.data[props.rowIndex] as QueueSong);

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
                props.rowIndex
            )}
        </TableColumnTextContainer>
    );
};
