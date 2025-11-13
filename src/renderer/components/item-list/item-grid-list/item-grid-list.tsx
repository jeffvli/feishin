import { useElementSize, useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { AnimatePresence } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import React, {
    CSSProperties,
    memo,
    ReactNode,
    RefObject,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
    FixedSizeList,
    ListChildComponentProps,
    ListOnItemsRenderedProps,
    ListOnScrollProps,
} from 'react-window';

import styles from './item-grid-list.module.css';

import {
    getDataRowsCount,
    ItemCard,
    ItemCardProps,
} from '/@/renderer/components/item-card/item-card';
import { ExpandedListContainer } from '/@/renderer/components/item-list/expanded-list-container';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    ItemListStateItem,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls, ItemListHandle } from '/@/renderer/components/item-list/types';
import { LibraryItem } from '/@/shared/types/domain-types';

interface VirtualizedGridListProps {
    controls: ItemControls;
    data: unknown[];
    enableDrag?: boolean;
    enableExpansion: boolean;
    enableSelection: boolean;
    gap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    height: number;
    initialTop?: ItemGridListProps['initialTop'];
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    onRangeChanged?: ItemGridListProps['onRangeChanged'];
    onScroll?: ItemGridListProps['onScroll'];
    onScrollEnd?: ItemGridListProps['onScrollEnd'];
    outerRef: RefObject<any>;
    ref: RefObject<FixedSizeList<GridItemProps>>;
    tableMeta: null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    };
    width: number;
}

const VirtualizedGridList = React.memo(
    ({
        controls,
        data,
        enableDrag,
        enableExpansion,
        enableSelection,
        gap,
        height,
        initialTop,
        internalState,
        itemType,
        onRangeChanged,
        onScroll,
        onScrollEnd,
        outerRef,
        ref,
        tableMeta,
        width,
    }: VirtualizedGridListProps) => {
        const itemData: GridItemProps = useMemo(() => {
            return {
                columns: tableMeta?.columnCount || 0,
                controls,
                data,
                enableDrag,
                enableExpansion,
                enableSelection,
                gap,
                internalState,
                itemType,
                tableMeta,
            };
        }, [
            tableMeta,
            controls,
            data,
            enableDrag,
            enableExpansion,
            enableSelection,
            gap,
            internalState,
            itemType,
        ]);

        const debouncedOnScrollEnd = useMemo(
            () =>
                onScrollEnd
                    ? debounce((scrollOffset: number, direction: 'down' | 'up') => {
                          onScrollEnd(scrollOffset, direction);
                      }, 100)
                    : undefined,
            [onScrollEnd],
        );

        useEffect(() => {
            return () => {
                debouncedOnScrollEnd?.cancel();
            };
        }, [debouncedOnScrollEnd]);

        const handleOnScroll = useCallback(
            ({ scrollDirection, scrollOffset }: ListOnScrollProps) => {
                onScroll?.(scrollOffset, scrollDirection === 'forward' ? 'down' : 'up');
                debouncedOnScrollEnd?.(scrollOffset, scrollDirection === 'forward' ? 'down' : 'up');
            },
            [onScroll, debouncedOnScrollEnd],
        );

        const debouncedOnItemsRendered = useMemo(() => {
            return debounce((items: ListOnItemsRenderedProps) => {
                onRangeChanged?.({
                    startIndex: items.visibleStartIndex * (tableMeta?.columnCount || 0),
                    stopIndex: items.visibleStopIndex * (tableMeta?.columnCount || 0),
                });
            }, 50);
        }, [onRangeChanged, tableMeta?.columnCount]);

        if (!tableMeta) {
            return null;
        }

        return (
            <FixedSizeList
                height={height}
                initialScrollOffset={initialTop || 0}
                itemCount={itemData.tableMeta?.rowCount || 0}
                itemData={itemData}
                itemSize={itemData.tableMeta?.itemHeight || 0}
                onItemsRendered={debouncedOnItemsRendered}
                onScroll={handleOnScroll}
                outerRef={outerRef}
                ref={ref}
                width={width}
            >
                {ListComponent}
            </FixedSizeList>
        );
    },
);

VirtualizedGridList.displayName = 'VirtualizedGridList';

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
    controls: ItemCardProps['controls'];
    data: any[];
    enableDrag?: boolean;
    enableExpansion?: boolean;
    enableSelection?: boolean;
    gap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    tableMeta: null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    };
}

export interface ItemGridListProps {
    currentPage?: number;
    data: unknown[];
    enableDrag?: boolean;
    enableExpansion?: boolean;
    enableSelection?: boolean;
    gap?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    initialTop?: number;
    itemsPerRow?: number;
    itemType: LibraryItem;
    onRangeChanged?: (range: { startIndex: number; stopIndex: number }) => void;
    onScroll?: (offset: number, direction: 'down' | 'up') => void;
    onScrollEnd?: (offset: number, direction: 'down' | 'up') => void;
    ref?: RefObject<ItemListHandle>;
}

export const ItemGridList = ({
    data,
    enableDrag = true,
    enableExpansion = true,
    enableSelection = true,
    gap = 'sm',
    initialTop,
    itemsPerRow,
    itemType,
    onRangeChanged,
    onScroll,
    onScrollEnd,
    ref,
}: ItemGridListProps) => {
    const rootRef = useRef(null);
    const outerRef = useRef(null);
    const listRef = useRef<FixedSizeList<GridItemProps>>(null);
    const { ref: containerRef, width: containerWidth } = useElementSize();
    const containerFocusRef = useRef<HTMLDivElement | null>(null);
    const handleRef = useRef<ItemListHandle | null>(null);
    const mergedContainerRef = useMergedRef(containerRef, rootRef, containerFocusRef);

    const getDataFn = useCallback(() => {
        return data;
    }, [data]);

    const internalState = useItemListState(getDataFn);

    const [initialize] = useOverlayScrollbars({
        defer: false,
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

    const hasExpanded = internalState.hasExpanded();

    const [tableMeta, setTableMeta] = useState<null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    }>(null);

    useEffect(() => {
        const { current: root } = rootRef;
        const { current: outer } = outerRef;

        if (root && outer) {
            initialize({
                elements: {
                    viewport: outer,
                },
                target: root,
            });
        }
    }, [initialize, tableMeta]);

    const throttledSetTableMeta = useMemo(() => {
        return createThrottledSetTableMeta(itemsPerRow);
    }, [itemsPerRow]);

    useLayoutEffect(() => {
        throttledSetTableMeta(containerWidth, data.length, itemType, setTableMeta);
    }, [containerWidth, data.length, itemType, throttledSetTableMeta]);

    const controls = useDefaultItemListControls();

    const scrollToIndex = useCallback(
        (index: number) => {
            if (!listRef.current || !tableMeta) return;
            const row = Math.floor(index / tableMeta.columnCount);
            listRef.current.scrollToItem(row, 'smart');
        },
        [tableMeta],
    );

    const scrollToOffset = useCallback((offset: number) => {
        if (!listRef.current) return;
        listRef.current.scrollTo(offset);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!enableSelection || !tableMeta) return;
            if (
                e.key !== 'ArrowDown' &&
                e.key !== 'ArrowUp' &&
                e.key !== 'ArrowLeft' &&
                e.key !== 'ArrowRight'
            )
                return;
            e.preventDefault();
            e.stopPropagation();

            const selected = internalState.getSelected();
            let currentIndex = -1;

            if (selected.length > 0) {
                const lastSelected = selected[selected.length - 1];
                currentIndex = data.findIndex(
                    (d: any) =>
                        d &&
                        typeof d === 'object' &&
                        'id' in d &&
                        d.id === (lastSelected as any).id,
                );
            }

            // Calculate grid position
            const currentRow =
                currentIndex !== -1 ? Math.floor(currentIndex / tableMeta.columnCount) : 0;
            const currentCol = currentIndex !== -1 ? currentIndex % tableMeta.columnCount : 0;
            const totalRows = Math.ceil(data.length / tableMeta.columnCount);

            let newIndex = 0;
            if (currentIndex !== -1) {
                switch (e.key) {
                    case 'ArrowDown': {
                        // Move down one row
                        const nextRow = currentRow + 1;
                        if (nextRow < totalRows) {
                            const nextRowStart = nextRow * tableMeta.columnCount;
                            const nextRowEnd = Math.min(
                                nextRowStart + tableMeta.columnCount - 1,
                                data.length - 1,
                            );
                            // Keep same column position, or use last item in row if column doesn't exist
                            newIndex = Math.min(nextRowStart + currentCol, nextRowEnd);
                        } else {
                            newIndex = currentIndex;
                        }
                        break;
                    }
                    case 'ArrowLeft': {
                        // Move left, wrap to previous row if at start of row
                        if (currentCol > 0) {
                            newIndex = currentIndex - 1;
                        } else if (currentRow > 0) {
                            // Wrap to end of previous row
                            newIndex = Math.max(
                                (currentRow - 1) * tableMeta.columnCount +
                                    tableMeta.columnCount -
                                    1,
                                0,
                            );
                            newIndex = Math.min(newIndex, data.length - 1);
                        } else {
                            newIndex = currentIndex;
                        }
                        break;
                    }
                    case 'ArrowRight': {
                        // Move right, wrap to next row if at end of row
                        if (
                            currentCol < tableMeta.columnCount - 1 &&
                            currentIndex < data.length - 1
                        ) {
                            newIndex = currentIndex + 1;
                        } else if (currentRow < totalRows - 1) {
                            // Wrap to start of next row
                            newIndex = Math.min(
                                (currentRow + 1) * tableMeta.columnCount,
                                data.length - 1,
                            );
                        } else {
                            newIndex = currentIndex;
                        }
                        break;
                    }
                    case 'ArrowUp': {
                        // Move up one row
                        const prevRow = currentRow - 1;
                        if (prevRow >= 0) {
                            const prevRowStart = prevRow * tableMeta.columnCount;
                            const prevRowEnd = Math.min(
                                prevRowStart + tableMeta.columnCount - 1,
                                data.length - 1,
                            );
                            // Keep same column position, or use last item in row if column doesn't exist
                            newIndex = Math.min(prevRowStart + currentCol, prevRowEnd);
                        } else {
                            newIndex = currentIndex;
                        }
                        break;
                    }
                }
            } else {
                // No selection, start at first item
                newIndex = 0;
            }

            const newItem: any = data[newIndex];
            if (!newItem) return;

            // Handle Shift + Arrow for incremental range selection (matches shift+click behavior)
            if (e.shiftKey) {
                const selectedItems = internalState.getSelected();
                const lastSelectedItem = selectedItems[selectedItems.length - 1];

                if (lastSelectedItem) {
                    // Find the indices of the last selected item and new item
                    const lastIndex = data.findIndex(
                        (d: any) =>
                            d &&
                            typeof d === 'object' &&
                            'id' in d &&
                            d.id === (lastSelectedItem as any).id,
                    );

                    if (lastIndex !== -1 && newIndex !== -1) {
                        // Create range selection from last selected to new position
                        const startIndex = Math.min(lastIndex, newIndex);
                        const stopIndex = Math.max(lastIndex, newIndex);

                        const rangeItems: ItemListStateItem[] = [];
                        for (let i = startIndex; i <= stopIndex; i++) {
                            const rangeItem = data[i];
                            if (
                                rangeItem &&
                                typeof rangeItem === 'object' &&
                                'id' in rangeItem &&
                                'serverId' in rangeItem
                            ) {
                                rangeItems.push({
                                    _serverId: (rangeItem as any).serverId,
                                    id: (rangeItem as any).id,
                                    itemType,
                                });
                            }
                        }

                        // Add range items to selection (matching shift+click behavior)
                        const currentSelected = internalState.getSelected();
                        const newSelected = [...currentSelected];
                        rangeItems.forEach((rangeItem) => {
                            if (
                                !newSelected.some((selected: any) => selected.id === rangeItem.id)
                            ) {
                                newSelected.push(rangeItem);
                            }
                        });

                        // Ensure the last item in selection is the item at newIndex for incremental extension
                        const newItemListItem: ItemListStateItem = {
                            _serverId: newItem.serverId,
                            id: newItem.id,
                            itemType,
                        };
                        // Remove the new item from its current position if it exists
                        const filteredSelected = newSelected.filter(
                            (item: any) => item.id !== newItemListItem.id,
                        );
                        // Add it at the end so it becomes the last selected item
                        filteredSelected.push(newItemListItem);
                        internalState.setSelected(filteredSelected as any);
                    }
                } else {
                    // No previous selection, just select the new item
                    internalState.setSelected([
                        {
                            _serverId: newItem.serverId,
                            id: newItem.id,
                            itemType,
                        },
                    ]);
                }
            } else {
                // Without Shift: select only the new item
                internalState.setSelected([
                    {
                        _serverId: newItem.serverId,
                        id: newItem.id,
                        itemType,
                    },
                ]);
            }

            scrollToIndex(newIndex);
        },
        [data, enableSelection, internalState, itemType, tableMeta, scrollToIndex],
    );

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
                scrollToIndex(index);
            },
            scrollToOffset: (offset: number) => {
                scrollToOffset(offset);
            },
        };
    }, [data, internalState, scrollToIndex, scrollToOffset]);

    useEffect(() => {
        handleRef.current = imperativeHandle;
    }, [imperativeHandle]);

    useImperativeHandle(ref, () => imperativeHandle, [imperativeHandle]);

    return (
        <div
            className={styles.itemGridContainer}
            data-overlayscrollbars-initialize=""
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => (e.currentTarget as HTMLDivElement).focus()}
            ref={mergedContainerRef}
            tabIndex={0}
        >
            <AutoSizer>
                {({ height, width }) => (
                    <VirtualizedGridList
                        controls={controls}
                        data={data}
                        enableDrag={enableDrag}
                        enableExpansion={enableExpansion}
                        enableSelection={enableSelection}
                        gap={gap}
                        height={height}
                        initialTop={initialTop}
                        internalState={internalState}
                        itemType={itemType}
                        onRangeChanged={onRangeChanged}
                        onScroll={onScroll ?? (() => {})}
                        onScrollEnd={onScrollEnd ?? (() => {})}
                        outerRef={outerRef}
                        ref={listRef}
                        tableMeta={tableMeta}
                        width={width}
                    />
                )}
            </AutoSizer>
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

const ListComponent = memo((props: ListChildComponentProps<GridItemProps>) => {
    const { index, style } = props;
    const { columns, controls, data, enableDrag, gap, itemType } = props.data;

    const items: ReactNode[] = [];
    const itemCount = data.length;
    const startIndex = index * columns;
    const stopIndex = Math.min(itemCount - 1, startIndex + columns - 1);

    const columnCountInRow = stopIndex - startIndex + 1;

    let columnCountToAdd = 0;

    if (columnCountInRow !== columns) {
        columnCountToAdd = columns - columnCountInRow;
    }

    for (let i = startIndex; i <= stopIndex + columnCountToAdd; i += 1) {
        if (i < data.length) {
            items.push(
                <div
                    className={clsx(styles.itemRow, styles[`gap-${gap}`])}
                    key={`card-${i}-${index}`}
                    style={{ '--columns': columns } as CSSProperties}
                >
                    <ItemCard
                        controls={controls}
                        data={data[i]}
                        enableDrag={enableDrag}
                        internalState={props.data.internalState}
                        itemType={itemType}
                        withControls
                    />
                </div>,
            );
        } else {
            items.push(null);
        }
    }

    return (
        <div className={styles.itemList} style={style}>
            {items}
        </div>
    );
});
