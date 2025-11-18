import throttle from 'lodash/throttle';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
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

import styles from './item-detail-list.module.css';

import { ItemDetail } from '/@/renderer/components/item-detail/item-detail';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { useItemListState } from '/@/renderer/components/item-list/helpers/item-list-state';
import { useElementSize } from '/@/shared/hooks/use-element-size';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
import { LibraryItem } from '/@/shared/types/domain-types';

export interface ItemDetailListProps {
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

export const ItemDetailList = ({
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
}: ItemDetailListProps) => {
    const itemDetailRef = useListRef(null);
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
    }, [itemDetailRef, initialize]);

    const hasExpanded = internalState.hasExpanded();

    const handleExpand = useCallback(
        (_e: MouseEvent<HTMLDivElement>, item: unknown, itemType: LibraryItem) => {
            if (item && typeof item === 'object' && 'id' in item && 'serverId' in item) {
                internalState.toggleExpanded({
                    _serverId: item.serverId as string,
                    id: item.id as string,
                    itemType: itemType,
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
        itemHeight: number;
    }>(null);

    // Throttled function to update table meta
    const throttledSetTableMeta = useMemo(() => {
        return throttle((width: number) => {
            const isSm = width >= 600;
            const isMd = width >= 768;
            const isLg = width >= 1200;
            const isXl = width >= 1500;
            const is2xl = width >= 1920;
            const is3xl = width >= 2560;

            let itemHeight = 160;

            if (is3xl) {
                itemHeight = 160;
            } else if (is2xl) {
                itemHeight = 160;
            } else if (isXl) {
                itemHeight = 160;
            } else if (isLg) {
                itemHeight = 160;
            } else if (isMd) {
                itemHeight = 160;
            } else if (isSm) {
                itemHeight = 160;
            } else {
                itemHeight = 160;
            }

            if (itemHeight === 0) {
                return;
            }

            setTableMeta({
                itemHeight,
            });
        }, 200);
    }, []);

    useLayoutEffect(() => {
        throttledSetTableMeta(containerWidth);
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
            className={styles.itemDetailContainer}
            data-overlayscrollbars-initialize=""
            initial={{ opacity: 0 }}
            ref={mergedContainerRef}
        >
            <List
                listRef={itemDetailRef}
                onRowsRendered={handleOnRowsRendered}
                onScroll={handleScroll}
                rowComponent={RowComponent}
                rowCount={data.length}
                rowHeight={tableMeta?.itemHeight || 0}
                rowProps={{
                    data,
                    handleExpand,
                    itemHeight: tableMeta?.itemHeight || 0,
                    itemType,
                }}
            />
            <AnimatePresence>
                {hasExpanded && (
                    <motion.div
                        animate="show"
                        className={styles.listExpandedContainer}
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
    data,
    handleExpand,
    index,
    itemHeight,
    itemType,
    style,
}: RowComponentProps<{
    data: any[];
    handleExpand: (e: MouseEvent<HTMLDivElement>, item: unknown, itemType: LibraryItem) => void;
    itemHeight: number;
    itemType: LibraryItem;
}>) {
    return (
        <div className={styles.itemList} style={style}>
            <ItemDetail
                data={data[index]}
                itemHeight={itemHeight}
                itemType={itemType}
                onClick={(e, item, itemType) => handleExpand(e, item, itemType)}
                withControls
            />
        </div>
    );
}
