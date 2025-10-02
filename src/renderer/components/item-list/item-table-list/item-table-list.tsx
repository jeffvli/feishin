// Component adapted from https://github.com/bvaughn/react-window/issues/826

import { useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    type JSXElementConstructor,
    MouseEvent,
    Ref,
    UIEvent,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { type CellComponentProps, Grid, GridImperativeAPI, type GridProps } from 'react-window-v2';

import styles from './item-table-list.module.css';

import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { useItemListState } from '/@/renderer/components/item-list/helpers/item-list-state';
import { LibraryItem } from '/@/shared/types/domain-types';

export interface ItemTableListColumn {
    id: string;
    label: string;
    width: number;
}

interface CellProps {
    columns: ItemTableListColumn[];
    data: unknown[];
}

interface ItemTableListProps {
    CellComponent: JSXElementConstructor<CellComponentProps<CellProps>>;
    columnCount: number;
    columns: ItemTableListColumn[];
    columnWidth: ((index: number, cellProps: CellProps) => number) | number;
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
    onCellsRendered: GridProps<CellProps>['onCellsRendered'];
    onEndReached?: (index: number) => void;
    onItemClick?: (item: unknown, index: number, event: MouseEvent<HTMLDivElement>) => void;
    onItemContextMenu?: (item: unknown, index: number, event: MouseEvent<HTMLDivElement>) => void;
    onItemDoubleClick?: (item: unknown, index: number, event: MouseEvent<HTMLDivElement>) => void;
    onRangeChanged?: (range: { endIndex: number; startIndex: number }) => void;
    onScroll?: (event: UIEvent<HTMLDivElement>) => void;
    onScrollEnd?: () => void;
    onStartReached?: (index: number) => void;
    ref?: Ref<GridImperativeAPI>;
    rowHeight: ((index: number, cellProps: CellProps) => number) | number;
    stickyColumnCount: number;
    stickyRowCount: number;
    totalItemCount: number;
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

export const ItemTableList = ({
    CellComponent,
    columnCount,
    columns,
    columnWidth,
    data,
    initialTopMostItemIndex,
    itemType,
    onCellsRendered,
    onEndReached,
    onItemClick,
    onItemContextMenu,
    onItemDoubleClick,
    onRangeChanged,
    onScroll,
    onScrollEnd,
    onStartReached,
    ref,
    rowHeight,
    stickyColumnCount,
    stickyRowCount,
    totalItemCount,
}: ItemTableListProps) => {
    const totalRowCount = totalItemCount - (stickyRowCount ?? 0);
    const totalColumnCount = columnCount - (stickyColumnCount ?? 0);
    const stickyRowRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const stickyColumnRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const mergedRowRef = useMergedRef(rowRef, scrollContainerRef);

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
            overflow: { x: 'scroll', y: 'scroll' },
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

        return undefined;
    }, [initialize]);

    useEffect(() => {
        const header = stickyRowRef.current?.childNodes[0] as HTMLDivElement;
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;
        const sticky = stickyColumnRef.current?.childNodes[0] as HTMLDivElement;

        // At minimum, we need the main row element
        if (row) {
            // Ensure all containers have the same height
            const syncHeights = () => {
                if (sticky) {
                    const rowHeight = row.scrollHeight;
                    const stickyHeight = sticky.scrollHeight;

                    // Set consistent heights - use the larger of the two
                    const targetHeight = Math.max(rowHeight, stickyHeight);
                    if (sticky.style.height !== `${targetHeight}px`) {
                        sticky.style.height = `${targetHeight}px`;
                    }
                    if (row.style.height !== `${targetHeight}px`) {
                        row.style.height = `${targetHeight}px`;
                    }
                }
            };

            const timeoutId = setTimeout(syncHeights, 0);

            const activeElement = { element: null } as { element: HTMLDivElement | null };
            const setActiveElement = (e: HTMLElementEventMap['pointermove']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };
            const setActiveElementFromWheel = (e: HTMLElementEventMap['wheel']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };

            const syncScroll = (e: HTMLElementEventMap['scroll']) => {
                if (e.currentTarget !== activeElement.element) {
                    return;
                }

                const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
                const scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;

                // Prevent recursive scroll events
                const isScrolling = { header: false, row: false, sticky: false };

                // Sync horizontal scroll between header and main content (only if header exists)
                if (header && e.currentTarget === header && !isScrolling.row) {
                    isScrolling.row = true;
                    row.scrollTo({
                        behavior: 'instant',
                        left: scrollLeft,
                    });
                    setTimeout(() => {
                        isScrolling.row = false;
                    }, 0);
                }

                // Sync from main content to header and sticky column
                if (e.currentTarget === row && !isScrolling.header && !isScrolling.sticky) {
                    if (header) {
                        isScrolling.header = true;
                        header.scrollTo({
                            behavior: 'instant',
                            left: scrollLeft,
                        });
                    }
                    if (sticky) {
                        isScrolling.sticky = true;
                        sticky.scrollTo({
                            behavior: 'instant',
                            top: scrollTop,
                        });
                    }
                    setTimeout(() => {
                        isScrolling.header = false;
                        isScrolling.sticky = false;
                    }, 0);
                }

                // Sync vertical scroll between sticky column and main content (only if sticky exists)
                if (sticky && e.currentTarget === sticky && !isScrolling.row) {
                    isScrolling.row = true;
                    row.scrollTo({
                        behavior: 'instant',
                        top: scrollTop,
                    });
                    setTimeout(() => {
                        isScrolling.row = false;
                    }, 0);
                }
            };

            // Add event listeners for elements that exist
            if (header) {
                header.addEventListener('pointermove', setActiveElement);
                header.addEventListener('wheel', setActiveElementFromWheel);
                header.addEventListener('scroll', syncScroll);
            }
            row.addEventListener('pointermove', setActiveElement);
            row.addEventListener('wheel', setActiveElementFromWheel);
            row.addEventListener('scroll', syncScroll);
            if (sticky) {
                sticky.addEventListener('pointermove', setActiveElement);
                sticky.addEventListener('wheel', setActiveElementFromWheel);
                sticky.addEventListener('scroll', syncScroll);
            }

            // Add resize observer to maintain height sync
            const resizeObserver = new ResizeObserver(() => {
                syncHeights();
            });

            resizeObserver.observe(row);
            if (sticky) {
                resizeObserver.observe(sticky);
            }

            return () => {
                clearTimeout(timeoutId);
                if (header) {
                    header.removeEventListener('pointermove', setActiveElement);
                    header.removeEventListener('wheel', setActiveElementFromWheel);
                    header.removeEventListener('scroll', syncScroll);
                }
                row.removeEventListener('pointermove', setActiveElement);
                row.removeEventListener('wheel', setActiveElementFromWheel);
                row.removeEventListener('scroll', syncScroll);
                if (sticky) {
                    sticky.removeEventListener('pointermove', setActiveElement);
                    sticky.removeEventListener('wheel', setActiveElementFromWheel);
                    sticky.removeEventListener('scroll', syncScroll);
                }
                resizeObserver.disconnect();
            };
        }

        return undefined;
    }, []);

    const cellProps = {
        columns,
        data,
    };

    const internalState = useItemListState();

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
    const handleOnCellsRendered = useCallback(
        (cells: {
            columnStartIndex: number;
            columnStopIndex: number;
            rowStartIndex: number;
            rowStopIndex: number;
        }) => {
            return onCellsRendered
                ? ({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }) => {
                      return onCellsRendered!(
                          {
                              columnStartIndex: columnStartIndex + (stickyColumnCount ?? 0),
                              columnStopIndex: columnStopIndex + (stickyColumnCount ?? 0),
                              rowStartIndex: rowStartIndex + (stickyRowCount ?? 0),
                              rowStopIndex: rowStopIndex + (stickyRowCount ?? 0),
                          },
                          cells,
                      );
                  }
                : undefined;
        },
        [onCellsRendered, stickyColumnCount, stickyRowCount],
    );

    const StickyRowCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + (stickyColumnCount ?? 0)}
                />
            );
        },
        [stickyColumnCount, CellComponent],
    );

    const StickyColumnCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <CellComponent
                    {...cellProps}
                    rowIndex={cellProps.rowIndex + (stickyRowCount ?? 0)}
                />
            );
        },
        [stickyRowCount, CellComponent],
    );

    const RowCell = useCallback(
        (cellProps: CellComponentProps<CellProps>) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + (stickyColumnCount ?? 0)}
                    // onClick={(e) => {
                    //     onItemClick?.(cellProps.data[cellProps.rowIndex], cellProps.rowIndex, e);
                    // }}
                    rowIndex={cellProps.rowIndex + (stickyRowCount ?? 0)}
                />
            );
        },
        [stickyColumnCount, stickyRowCount, CellComponent],
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
            className={styles.itemTableContainer}
            initial={{ opacity: 0 }}
        >
            <div
                className={styles.itemTableStickyColumnsGridContainer}
                style={{
                    minWidth: `${Array.from({ length: stickyColumnCount ?? 0 }, () => 0).reduce(
                        (a, _, i) =>
                            a +
                            (typeof columnWidth === 'number'
                                ? columnWidth
                                : columnWidth(i, cellProps)),
                        0,
                    )}px`,
                }}
            >
                {!!(stickyColumnCount || stickyRowCount) && (
                    <div
                        className={styles.itemTableStickyIntersectionGridContainer}
                        style={{
                            minHeight: `${Array.from(
                                { length: stickyRowCount ?? 0 },
                                () => 0,
                            ).reduce(
                                (a, _, i) =>
                                    a +
                                    (typeof rowHeight === 'number'
                                        ? rowHeight
                                        : rowHeight(i, cellProps)),
                                0,
                            )}px`,
                        }}
                    >
                        <Grid
                            cellComponent={CellComponent as any}
                            cellProps={cellProps}
                            className={styles.noScrollbar}
                            columnCount={stickyColumnCount}
                            columnWidth={columnWidth}
                            rowCount={stickyRowCount}
                            rowHeight={rowHeight}
                        />
                    </div>
                )}
                {!!stickyColumnCount && (
                    <div className={styles.itemTableStickyColumnsContainer} ref={stickyColumnRef}>
                        <Grid
                            cellComponent={StickyColumnCell}
                            cellProps={cellProps}
                            className={clsx(styles.noScrollbar, styles.height100)}
                            columnCount={stickyColumnCount}
                            columnWidth={columnWidth}
                            rowCount={totalRowCount}
                            rowHeight={(index, cellProps) => {
                                return typeof rowHeight === 'number'
                                    ? rowHeight
                                    : rowHeight(index + (stickyRowCount ?? 0), cellProps);
                            }}
                        />
                    </div>
                )}
            </div>
            <div className={styles.itemTableStickyRowsContainer}>
                {!!stickyRowCount && (
                    <div
                        className={styles.itemTableStickyRowsGridContainer}
                        ref={stickyRowRef}
                        style={{
                            minHeight: `${Array.from(
                                { length: stickyRowCount ?? 0 },
                                () => 0,
                            ).reduce(
                                (a, _, i) =>
                                    a +
                                    (typeof rowHeight === 'number'
                                        ? rowHeight
                                        : rowHeight(i, cellProps)),
                                0,
                            )}px`,
                        }}
                    >
                        <Grid
                            cellComponent={StickyRowCell}
                            cellProps={cellProps}
                            className={styles.noScrollbar}
                            columnCount={totalColumnCount}
                            columnWidth={(index, cellProps) => {
                                return typeof columnWidth === 'number'
                                    ? columnWidth
                                    : columnWidth(index + (stickyColumnCount ?? 0), cellProps);
                            }}
                            rowCount={Array.from({ length: stickyRowCount ?? 0 }, () => 0).length}
                            rowHeight={(index, cellProps) => {
                                return typeof rowHeight === 'number'
                                    ? rowHeight
                                    : rowHeight(index, cellProps);
                            }}
                        />
                    </div>
                )}
                <div className={styles.itemTableGridContainer} ref={mergedRowRef}>
                    <Grid
                        cellComponent={RowCell}
                        cellProps={cellProps}
                        className={styles.height100}
                        columnCount={totalColumnCount}
                        columnWidth={(index, cellProps) => {
                            return typeof columnWidth === 'number'
                                ? columnWidth
                                : columnWidth(index + (stickyColumnCount ?? 0), cellProps);
                        }}
                        onCellsRendered={handleOnCellsRendered}
                        rowCount={totalRowCount}
                        rowHeight={(index, cellProps) => {
                            return typeof rowHeight === 'number'
                                ? rowHeight
                                : rowHeight(index + (stickyRowCount ?? 0), cellProps);
                        }}
                    />
                </div>
            </div>
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
