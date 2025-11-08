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
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemControls, ItemListHandle } from '/@/renderer/components/item-list/types';
import { LibraryItem } from '/@/shared/types/domain-types';

interface VirtualizedGridListProps {
    controls: ItemControls;
    data: unknown[];
    enableExpansion: boolean;
    enableSelection: boolean;
    gap: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
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
}

const VirtualizedGridList = React.memo(
    ({
        controls,
        data,
        enableExpansion,
        enableSelection,
        gap,
        initialTop,
        internalState,
        itemType,
        onRangeChanged,
        onScroll,
        onScrollEnd,
        outerRef,
        ref,
        tableMeta,
    }: VirtualizedGridListProps) => {
        const itemData: GridItemProps = useMemo(() => {
            return {
                columns: tableMeta?.columnCount || 0,
                controls,
                data,
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
            <div className={styles.autoSizerContainer}>
                <AutoSizer>
                    {({ height, width }) => {
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
                    }}
                </AutoSizer>
            </div>
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
    const mergedContainerRef = useMergedRef(containerRef, rootRef);

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
    }, [initialize]);

    const hasExpanded = internalState.hasExpanded();

    const [tableMeta, setTableMeta] = useState<null | {
        columnCount: number;
        itemHeight: number;
        rowCount: number;
    }>(null);

    const throttledSetTableMeta = useMemo(() => {
        return createThrottledSetTableMeta(itemsPerRow);
    }, [itemsPerRow]);

    useLayoutEffect(() => {
        throttledSetTableMeta(containerWidth, data.length, itemType, setTableMeta);
    }, [containerWidth, data.length, itemType, throttledSetTableMeta]);

    const controls = useDefaultItemListControls();

    return (
        <div
            className={styles.itemGridContainer}
            data-overlayscrollbars-initialize=""
            ref={mergedContainerRef}
        >
            <VirtualizedGridList
                controls={controls}
                data={data}
                enableExpansion={enableExpansion}
                enableSelection={enableSelection}
                gap={gap}
                initialTop={initialTop}
                internalState={internalState}
                itemType={itemType}
                onRangeChanged={onRangeChanged}
                onScroll={onScroll ?? (() => {})}
                onScrollEnd={onScrollEnd ?? (() => {})}
                outerRef={outerRef}
                ref={listRef}
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

const ListComponent = memo((props: ListChildComponentProps<GridItemProps>) => {
    const { index, style } = props;
    const { columns, controls, data, gap, itemType } = props.data;

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
