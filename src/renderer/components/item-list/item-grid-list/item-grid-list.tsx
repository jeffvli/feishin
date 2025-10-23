import { useElementSize, useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { AnimatePresence } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import React, {
    CSSProperties,
    Ref,
    UIEvent,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { List, RowComponentProps, useListRef } from 'react-window-v2';

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

interface VirtualizedGridListProps {
    data: unknown[];
    enableExpansion: boolean;
    enableSelection: boolean;
    gap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    internalState: ItemListStateActions;
    itemGridRef: React.RefObject<any>;
    itemType: LibraryItem;
    onRowsRendered: (visibleRows: { startIndex: number; stopIndex: number }) => void;
    onScroll: (e: UIEvent<HTMLDivElement>) => void;
    tableMeta: null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    };
}

const VirtualizedGridList = React.memo(
    ({
        data,
        enableExpansion,
        enableSelection,
        gap,
        internalState,
        itemGridRef,
        itemType,
        onRowsRendered,
        onScroll,
        tableMeta,
    }: VirtualizedGridListProps) => {
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
            gap,
            internalState,
            itemType,
        };

        return (
            <List
                listRef={itemGridRef}
                onRowsRendered={onRowsRendered}
                onScroll={onScroll}
                rowComponent={ListComponent}
                rowCount={tableMeta?.rowCount || 0}
                rowHeight={tableMeta?.itemHeight || 0}
                rowProps={itemProps}
            />
        );
    },
);

VirtualizedGridList.displayName = 'VirtualizedGridList';

// Throttled function moved outside component for better performance
const createThrottledSetTableMeta = (itemsPerRow?: number) => {
    return throttle(
        (
            width: number,
            dataLength: number,
            type: LibraryItem,
            setTableMeta: (meta: any) => void,
        ) => {
            const isSm = width >= 600;
            const isMd = width >= 768;
            const isLg = width >= 960;
            const isXl = width >= 1200;
            const is2xl = width >= 1440;
            const is3xl = width >= 1920;
            const is4xl = width >= 2560;

            let dynamicItemsPerRow = 2;

            if (is4xl) {
                dynamicItemsPerRow = 12;
            } else if (is3xl) {
                dynamicItemsPerRow = 10;
            } else if (is2xl) {
                dynamicItemsPerRow = 8;
            } else if (isXl) {
                dynamicItemsPerRow = 6;
            } else if (isLg) {
                dynamicItemsPerRow = 5;
            } else if (isMd) {
                dynamicItemsPerRow = 4;
            } else if (isSm) {
                dynamicItemsPerRow = 3;
            } else {
                dynamicItemsPerRow = 2;
            }

            const setItemsPerRow = itemsPerRow || dynamicItemsPerRow;

            const widthPerItem = Number(width) / setItemsPerRow;
            const itemHeight = widthPerItem + getDataRowsCount(type) * 26;

            if (widthPerItem === 0) {
                return;
            }

            setTableMeta({
                columnCount: setItemsPerRow,
                itemHeight,
                rowCount: Math.ceil(dataLength / setItemsPerRow),
            });
        },
        200,
    );
};

export interface GridItemProps {
    columns: number;
    data: any[];
    enableExpansion?: boolean;
    enableSelection?: boolean;
    gap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    internalState: ItemListStateActions;
    itemType: LibraryItem;
}

export interface ItemGridListProps {
    currentPage?: number;
    data: unknown[];
    enableExpansion?: boolean;
    enableSelection?: boolean;
    gap?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    initialTop?: {
        behavior?: 'auto' | 'smooth';
        to: number;
        type: 'index' | 'offset';
    };
    itemsPerRow?: number;
    itemType: LibraryItem;
    onEndReached?: (index: number, handle: ItemListHandle) => void;
    onRangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
    onScroll?: (e: UIEvent<HTMLDivElement>) => void;
    onScrollEnd?: (offset: number, handle: ItemListHandle) => void;
    onStartReached?: (index: number, handle: ItemListHandle) => void;
    ref?: Ref<ItemListHandle>;
}

export const ItemGridList = ({
    currentPage,
    data,
    enableExpansion = true,
    enableSelection = true,
    gap = 'sm',
    initialTop,
    itemsPerRow,
    itemType,
    onEndReached,
    onRangeChanged,
    onScroll,
    onScrollEnd,
    onStartReached,
    ref,
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

    const isInitialScrollPositionSet = useRef<boolean>(false);

    const hasExpanded = internalState.hasExpanded();

    const handleOnScrollEnd = useCallback(
        (scrollTop: number, handle: ItemListHandle) => {
            onScrollEnd?.(scrollTop, handle);
        },
        [onScrollEnd],
    );

    const debouncedOnScrollEnd = debounce(handleOnScrollEnd, 150);

    const handleScroll = useCallback(
        (e: UIEvent<HTMLDivElement>) => {
            onScroll?.(e);
            debouncedOnScrollEnd(
                e.currentTarget.scrollTop,
                itemGridRef.current ?? (undefined as any),
            );
        },
        [onScroll, debouncedOnScrollEnd, itemGridRef],
    );

    const scrollToGridOffset = useCallback((offset: number) => {
        const scrollContainer = scrollContainerRef.current?.firstElementChild as
            | HTMLElement
            | undefined;

        if (scrollContainer) {
            scrollContainer.scrollTo({ behavior: 'instant', top: offset });
        }
    }, []);

    const [tableMeta, setTableMeta] = useState<null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    }>(null);

    // Use throttled function created outside component for better performance
    const throttledSetTableMeta = useMemo(() => {
        return createThrottledSetTableMeta(itemsPerRow);
    }, [itemsPerRow]);

    useLayoutEffect(() => {
        throttledSetTableMeta(containerWidth, data.length, itemType, setTableMeta);
    }, [containerWidth, data.length, itemType, throttledSetTableMeta]);

    const handleOnRowsRendered = useCallback(
        (visibleRows: { startIndex: number; stopIndex: number }) => {
            onRangeChanged?.({
                endIndex: visibleRows.stopIndex * (tableMeta?.columnCount || 0),
                startIndex: visibleRows.startIndex * (tableMeta?.columnCount || 0),
            });

            if (onStartReached || onEndReached) {
                const totalRows = Math.ceil(data.length / (tableMeta?.columnCount || 0));
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
            data.length,
            itemGridRef,
        ],
    );

    // Scroll to top when currentPage changes
    useEffect(() => {
        if (currentPage !== undefined && tableMeta?.itemHeight) {
            scrollToGridOffset(0);
        }
    }, [currentPage, scrollToGridOffset, tableMeta?.itemHeight]);

    useEffect(() => {
        if (!initialTop || isInitialScrollPositionSet.current || !tableMeta?.itemHeight) return;

        // Only set initial scroll position if we haven't done it yet AND we're not on a page change
        // This prevents the initial scroll position from being restored on every page change
        if (currentPage !== undefined && currentPage > 0) {
            isInitialScrollPositionSet.current = true;
            return;
        }

        isInitialScrollPositionSet.current = true;

        if (initialTop.type === 'offset') {
            scrollToGridOffset(initialTop.to);
        } else {
            itemGridRef.current?.scrollToRow({
                behavior: initialTop.behavior,
                index: initialTop.to,
            });
        }
    }, [initialTop, itemGridRef, scrollToGridOffset, tableMeta?.itemHeight, currentPage]);

    const imperativeHandle: ItemListHandle = useMemo(() => {
        return {
            clearExpanded: () => {
                internalState.clearExpanded();
            },
            clearSelected: () => {
                internalState.clearSelected();
            },
            getItem: (index: number) => data[index],
            getItemCount: () => data.length,
            getItems: () => data,
            internalState,
            scrollToIndex: (index: number) => {
                itemGridRef.current?.scrollToRow({
                    align: 'smart',
                    behavior: 'auto',
                    index: Math.floor(index / (tableMeta?.columnCount || 1)),
                });
            },
            scrollToOffset: (offset: number) => {
                scrollToGridOffset(offset);
            },
        };
    }, [data, internalState, scrollToGridOffset, tableMeta?.columnCount, itemGridRef]);

    useImperativeHandle(ref, () => imperativeHandle);

    return (
        <div
            className={styles.itemGridContainer}
            data-overlayscrollbars-initialize=""
            ref={mergedContainerRef}
        >
            <VirtualizedGridList
                data={data}
                enableExpansion={enableExpansion}
                enableSelection={enableSelection}
                gap={gap}
                internalState={internalState}
                itemGridRef={itemGridRef}
                itemType={itemType}
                onRowsRendered={handleOnRowsRendered}
                onScroll={handleScroll}
                tableMeta={tableMeta}
            />
            <AnimatePresence>
                {hasExpanded && (
                    <ExpandedListContainer>
                        <ExpandedListItem internalState={internalState} itemType={itemType} />
                    </ExpandedListContainer>
                )}
            </AnimatePresence>
        </div>
    );
};

const ListComponent = ({
    columns,
    data,
    enableExpansion,
    enableSelection,
    gap,
    index,
    internalState,
    itemType,
    style,
}: RowComponentProps<GridItemProps>) => {
    return (
        <div className={styles.itemList} style={style}>
            {data[index].map((d) => (
                <div
                    className={clsx(styles.itemRow, styles[`gap-${gap}`])}
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
