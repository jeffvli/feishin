import clsx from 'clsx';
import { ReactNode, useCallback, useState } from 'react';

import styles from './row-index-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
    TableColumnTextContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { ItemRowPlayControls } from '/@/renderer/features/shared/components/item-row-play-controls';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Popover } from '/@/shared/components/popover/popover';
import { Text } from '/@/shared/components/text/text';
import { Play } from '/@/shared/types/types';

export const RowPlayControlCell = (
    props: ItemTableListInnerColumn & {
        indexContent: ReactNode;
        onPlay: (playType: Play) => void;
        showPlayControls: boolean;
    },
) => {
    const {
        controls,
        data,
        enableExpansion,
        getRowItem,
        indexContent,
        internalState,
        itemType,
        onPlay,
        rowIndex,
        showPlayControls,
    } = props;
    const [playControlsOpened, setPlayControlsOpened] = useState(false);

    const openPlayControls = useCallback(() => {
        setPlayControlsOpened(true);
    }, []);

    const closePlayControls = useCallback(() => {
        setPlayControlsOpened(false);
    }, []);

    const handleExpand = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            const item = (getRowItem?.(rowIndex) ?? data[rowIndex]) as ItemListItem;
            const rowId = internalState.extractRowId(item);
            const index = rowId ? internalState.findItemIndex(rowId) : -1;
            controls.onExpand?.({
                event: e,
                index,
                internalState,
                item,
                itemType,
            });
        },
        [controls, data, getRowItem, internalState, itemType, rowIndex],
    );

    const getIndexDisplay = (useMutedText: boolean) => {
        const hideOnHoverClass = enableExpansion ? 'hide-on-hover' : undefined;

        if (typeof indexContent === 'number') {
            return useMutedText ? (
                <Text className={hideOnHoverClass} isMuted isNoSelect>
                    {indexContent}
                </Text>
            ) : (
                indexContent
            );
        }

        return <span className={hideOnHoverClass}>{indexContent}</span>;
    };

    const expansionTarget = (
        <div className={styles.playTarget}>
            {getIndexDisplay(true)}
            <div className={clsx(styles.expand, 'hover-only')}>
                <ActionIcon
                    icon="arrowDownS"
                    iconProps={{ color: 'muted', size: 'md' }}
                    onClick={handleExpand}
                    size="xs"
                    variant="subtle"
                />
            </div>
        </div>
    );

    if (enableExpansion) {
        return (
            <TableColumnContainer {...props} className={styles.expansionCell}>
                <div className={styles.expansionInner}>
                    {showPlayControls ? (
                        <Popover
                            onChange={setPlayControlsOpened}
                            opened={playControlsOpened}
                            position="top"
                            transitionProps={{
                                enterDelay: 150,
                                exitDelay: 150,
                                transition: 'fade',
                            }}
                            withArrow
                            withinPortal
                        >
                            <Popover.Target>
                                <div
                                    className={styles.playControlTarget}
                                    onFocus={openPlayControls}
                                    onMouseEnter={openPlayControls}
                                    onMouseLeave={closePlayControls}
                                >
                                    {expansionTarget}
                                </div>
                            </Popover.Target>
                            <Popover.Dropdown
                                onClick={(e) => e.stopPropagation()}
                                onMouseEnter={openPlayControls}
                                onMouseLeave={closePlayControls}
                            >
                                <ItemRowPlayControls onPlay={onPlay} />
                            </Popover.Dropdown>
                        </Popover>
                    ) : (
                        expansionTarget
                    )}
                </div>
            </TableColumnContainer>
        );
    }

    if (!showPlayControls) {
        return (
            <TableColumnTextContainer {...props}>{getIndexDisplay(false)}</TableColumnTextContainer>
        );
    }

    return (
        <TableColumnTextContainer {...props} className={styles.fullSizeContent}>
            <Popover
                onChange={setPlayControlsOpened}
                opened={playControlsOpened}
                position="top"
                transitionProps={{ enterDelay: 150, exitDelay: 150, transition: 'fade' }}
                withArrow
                withinPortal
            >
                <Popover.Target>
                    <div
                        className={styles.playControlTarget}
                        onFocus={openPlayControls}
                        onMouseEnter={openPlayControls}
                        onMouseLeave={closePlayControls}
                    >
                        <Flex className={styles.indexContent} justify="center" w="100%">
                            {getIndexDisplay(false)}
                        </Flex>
                    </div>
                </Popover.Target>
                <Popover.Dropdown
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={openPlayControls}
                    onMouseLeave={closePlayControls}
                >
                    <ItemRowPlayControls onPlay={onPlay} />
                </Popover.Dropdown>
            </Popover>
        </TableColumnTextContainer>
    );
};
