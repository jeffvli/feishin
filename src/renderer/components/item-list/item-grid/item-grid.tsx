import { useElementSize, useMergedRef } from '@mantine/hooks';
import { throttle } from 'lodash';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    CSSProperties,
    MouseEvent,
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

import styles from './item-grid.module.css';

import { getDataRowsCount, ItemCard } from '/@/renderer/components/item-card/item-card';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import {
    ItemListStateActions,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { LibraryItem } from '/@/shared/types/domain-types';

export interface ItemGridProps {
    data: unknown[];
    enableExpansion?: boolean;
    enableSelection?: boolean;
    initialTopMostItemIndex?:
        | number
        | {
              align: 'center' | 'end' | 'start';
              behavior: 'auto' | 'smooth';
              index: number;
              offset?: number;
          };
    itemType: LibraryItem;
    onEndReached?: (index: number) => void;
    onItemClick?: (item: unknown, index: number) => void;
    onItemContextMenu?: (item: unknown, index: number) => void;
    onItemDoubleClick?: (item: unknown, index: number) => void;
    onRangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
    onScroll?: (e: UIEvent<HTMLDivElement>) => void;
    onScrollEnd?: () => void;
    onStartReached?: (index: number) => void;
    ref: Ref<ListImperativeAPI>;
    totalItemCount?: number;
}

interface ItemContext {
    enableExpansion?: boolean;
    enableSelection?: boolean;
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    onItemClick?: (item: unknown, index: number) => void;
    onItemContextMenu?: (item: unknown, index: number) => void;
    onItemDoubleClick?: (item: unknown, index: number) => void;
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

export const ItemGrid = ({
    data,
    enableExpansion = false,
    enableSelection = false,
    initialTopMostItemIndex = 0,
    itemType,
    onEndReached,
    onItemClick,
    onItemContextMenu,
    onItemDoubleClick,
    onRangeChanged,
    onScroll,
    onScrollEnd,
    onStartReached,
    totalItemCount = 0,
}: ItemGridProps) => {
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

    const handleExpand = useCallback(
        (_e: MouseEvent<HTMLDivElement>, item: unknown, itemType: LibraryItem) => {
            if (item && typeof item === 'object' && 'id' in item && 'serverId' in item) {
                internalState.toggleExpanded({
                    id: item.id as string,
                    itemType: itemType,
                    serverId: item.serverId as string,
                });
            }
        },
        [internalState],
    );

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
                    onStartReached?.(startRow);
                }
                if (endRow >= totalRows) {
                    onEndReached?.(endRow);
                }
            }
        },
        [onEndReached, onRangeChanged, onStartReached, totalItemCount, tableMeta?.columnCount],
    );

    const elements = useMemo(() => {
        if (!tableMeta) {
            return [];
        }

        console.log('data change');

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

    return (
        <motion.div
            animate={{
                height: '100%',
                opacity: 1,
                transition: {
                    duration: 0.5,
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
                rowComponent={RowComponent}
                rowCount={tableMeta?.rowCount || 0}
                rowHeight={tableMeta?.itemHeight || 0}
                rowProps={{
                    columns: tableMeta?.columnCount || 0,
                    data: elements,
                    handleExpand,
                    itemType,
                }}
            />
            <AnimatePresence>
                {hasExpanded && (
                    <motion.div
                        animate="show"
                        className={styles.gridExpandedContainer}
                        exit="hidden"
                        initial="hidden"
                        style={{ height: '500px' }}
                        variants={expandedAnimationVariants}
                    >
                        <ExpandedListItem internalState={internalState} itemType={itemType} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

function RowComponent({
    columns,
    data,
    handleExpand,
    index,
    itemType,
    style,
}: RowComponentProps<{
    columns: number;
    data: any[];
    handleExpand: (e: MouseEvent<HTMLDivElement>, item: unknown, itemType: LibraryItem) => void;
    itemType: LibraryItem;
}>) {
    return (
        <div className={styles.itemList} style={style}>
            {data[index].map((d) => (
                <div
                    className={styles.itemRow}
                    key={d.index}
                    style={{ '--columns': columns } as CSSProperties}
                >
                    <ItemCard
                        data={d.data}
                        itemType={itemType}
                        onClick={(e, item, itemType) => handleExpand(e, item, itemType)}
                        type="poster"
                        withControls
                    />
                </div>
            ))}
        </div>
    );
}
