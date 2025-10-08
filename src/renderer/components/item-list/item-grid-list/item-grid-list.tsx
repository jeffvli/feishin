import { useElementSize, useMergedRef } from '@mantine/hooks';
import { throttle } from 'lodash';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    CSSProperties,
    Ref,
    UIEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { List, ListImperativeAPI, RowComponentProps, useListRef } from 'react-window-v2';

import { ExpandedListContainer } from '../expanded-list-container';
import styles from './item-grid-list.module.css';

import { getDataRowsCount, ItemCard } from '/@/renderer/components/item-card/item-card';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { itemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { LibraryItem } from '/@/shared/types/domain-types';

export interface GridItemProps {
    columns: number;
    data: any[];
    enableExpansion?: boolean;
    enableSelection?: boolean;
    internalState: ItemListStateActions;
    itemType: LibraryItem;
}

export interface ItemGridListProps {
    data: unknown[];
    enableExpansion?: boolean;
    enableSelection?: boolean;
    initialTop?: {
        behavior?: 'auto' | 'smooth';
        to: number;
        type: 'index' | 'offset';
    };
    itemType: LibraryItem;
    onEndReached?: (index: number, handle: ItemListHandle) => void;
    onRangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
    onScroll?: (e: UIEvent<HTMLDivElement>) => void;
    onScrollEnd?: (offset: number, handle: ItemListHandle) => void;
    onStartReached?: (index: number, handle: ItemListHandle) => void;
    ref: Ref<ListImperativeAPI>;
    totalItemCount?: number;
}

const expandedAnimationVariants: Variants = {
    hidden: {
        height: 0,
        minHeight: 0,
    },
    show: {
        minHeight: '300px',
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
};

export const ItemGridList = ({
    data,
    enableExpansion = false,
    enableSelection = false,
    itemType,
    onEndReached,
    onRangeChanged,
    onScroll,
    onStartReached,
    totalItemCount = 0,
}: ItemGridListProps) => {
    const itemGridRef = useListRef(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const { ref: containerRef, width: containerWidth } = useElementSize();
    const mergedContainerRef = useMergedRef(containerRef, scrollContainerRef);

    const internalState = useItemListState();

    const [initialize] = useOverlayScrollbars({
        defer: true,
        events: {
            initialized(osInstance) {
                const { viewport } = osInstance.elements();
                viewport.style.overflowX = `var(--os-viewport-overflow-x)`;
                viewport.style.overflowY = `var(--os-viewport-overflow-y)`;
            },
        },
        options: {
            overflow: { x: 'hidden', y: 'scroll' },
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500,
                pointers: ['mouse', 'pen', 'touch'],
                theme: 'feishin-os-scrollbar',
                visibility: 'visible',
            },
        },
    });

    useEffect(() => {
        const { current: root } = scrollContainerRef;

        if (root) {
            initialize({
                elements: { viewport: root.firstElementChild as HTMLElement },
                target: root,
            });
        }
    }, [itemGridRef, initialize]);

    const hasExpanded = internalState.hasExpanded();

    const handleScroll = useCallback(
        (e: UIEvent<HTMLDivElement>) => {
            onScroll?.(e);
        },
        [onScroll],
    );

    const [tableMeta, setTableMeta] = useState<null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    }>(null);

    // Throttled function to update table meta
    const throttledSetTableMeta = useMemo(() => {
        return throttle((width: number, dataLength: number, type: LibraryItem) => {
            const isSm = width >= 600;
            const isMd = width >= 768;
            const isLg = width >= 1200;
            const isXl = width >= 1500;
            const is2xl = width >= 1920;
            const is3xl = width >= 2560;

            let itemsPerRow = 2;

            if (is3xl) {
                itemsPerRow = 12;
            } else if (is2xl) {
                itemsPerRow = 10;
            } else if (isXl) {
                itemsPerRow = 8;
            } else if (isLg) {
                itemsPerRow = 6;
            } else if (isMd) {
                itemsPerRow = 4;
            } else if (isSm) {
                itemsPerRow = 3;
            } else {
                itemsPerRow = 2;
            }
            const widthPerItem = Number(width) / itemsPerRow;
            const itemHeight = widthPerItem + getDataRowsCount(type) * 26;

            if (widthPerItem === 0) {
                return;
            }

            setTableMeta({
                columnCount: itemsPerRow,
                itemHeight,
                rowCount: Math.ceil(dataLength / itemsPerRow),
            });
        }, 200);
    }, []);

    useLayoutEffect(() => {
        throttledSetTableMeta(containerWidth, data.length, itemType);
    }, [containerWidth, data.length, itemType, throttledSetTableMeta]);

    const handleOnRowsRendered = useCallback(
        (visibleRows: { startIndex: number; stopIndex: number }) => {
            onRangeChanged?.({
                endIndex: visibleRows.stopIndex * (tableMeta?.columnCount || 0),
                startIndex: visibleRows.startIndex * (tableMeta?.columnCount || 0),
            });

            if (onStartReached || onEndReached) {
                const totalRows = Math.ceil(totalItemCount / (tableMeta?.columnCount || 0));
                const startRow = visibleRows.startIndex;
                const endRow = visibleRows.stopIndex;

                if (startRow === 0) {
                    onStartReached?.(startRow, itemGridRef.current ?? (undefined as any));
                }
                if (endRow >= totalRows) {
                    onEndReached?.(endRow, itemGridRef.current ?? (undefined as any));
                }
            }
        },
        [
            onRangeChanged,
            tableMeta?.columnCount,
            onStartReached,
            onEndReached,
            totalItemCount,
            itemGridRef,
        ],
    );

    const elements = useMemo(() => {
        if (!tableMeta) {
            return [];
        }

        return data
            .map((d, i) => {
                return {
                    data: d,
                    index: i,
                };
            })
            .reduce(
                (acc, d) => {
                    if (d.index % (tableMeta?.columnCount || 0) === 0) {
                        acc.push([]);
                    }
                    const prev = acc[acc.length - 1];
                    prev.push(d);
                    return acc;
                },
                [] as { data: any; index: number }[][],
            );
    }, [tableMeta, data]);

    const itemProps: GridItemProps = {
        columns: tableMeta?.columnCount || 0,
        data: elements,
        enableExpansion,
        enableSelection,
        internalState,
        itemType,
    };

    return (
        <motion.div
            animate={{
                height: '100%',
                opacity: 1,
                transition: {
                    duration: 1,
                    ease: 'backInOut',
                },
            }}
            className={styles.itemGridContainer}
            data-overlayscrollbars-initialize=""
            initial={{ opacity: 0 }}
            ref={mergedContainerRef}
        >
            <List
                listRef={itemGridRef}
                onRowsRendered={handleOnRowsRendered}
                onScroll={handleScroll}
                rowComponent={ListComponent}
                rowCount={tableMeta?.rowCount || 0}
                rowHeight={tableMeta?.itemHeight || 0}
                rowProps={itemProps}
            />
            <AnimatePresence>
                {hasExpanded && (
                    <ExpandedListContainer>
                        <ExpandedListItem internalState={internalState} itemType={itemType} />
                    </ExpandedListContainer>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ListComponent = ({
    columns,
    data,
    enableExpansion,
    enableSelection,
    index,
    internalState,
    itemType,
    style,
}: RowComponentProps<GridItemProps>) => {
    return (
        <div className={styles.itemList} style={style}>
            {data[index].map((d) => (
                <div
                    className={styles.itemRow}
                    key={d.index}
                    style={{ '--columns': columns } as CSSProperties}
                >
                    <ItemCard
                        controls={{
                            onClick: enableSelection
                                ? (item, itemType) => {
                                      return itemListControls.handleItemClick(
                                          item,
                                          itemType,
                                          internalState,
                                      );
                                  }
                                : undefined,
                            onDoubleClick: (item, itemType) => {
                                return itemListControls.handleItemDoubleClick(
                                    item,
                                    itemType,
                                    internalState,
                                );
                            },
                            onFavorite: (item, itemType) => {
                                return itemListControls.handleItemFavorite(
                                    item,
                                    itemType,
                                    internalState,
                                );
                            },
                            onItemExpand: enableExpansion
                                ? (item, itemType) => {
                                      return itemListControls.handleItemExpand(
                                          item,
                                          itemType,
                                          internalState,
                                      );
                                  }
                                : undefined,
                            onMore: (item, itemType) => {
                                return itemListControls.handleItemMore(
                                    item,
                                    itemType,
                                    internalState,
                                );
                            },
                            onPlay: (item, itemType, playType) => {
                                return itemListControls.handleItemPlay(
                                    item,
                                    itemType,
                                    playType,
                                    internalState,
                                );
                            },
                            onRating: (item, itemType) => {
                                return itemListControls.handleItemRating(
                                    item,
                                    itemType,
                                    internalState,
                                );
                            },
                        }}
                        data={d.data}
                        itemType={itemType}
                        withControls
                    />
                </div>
            ))}
        </div>
    );
};
