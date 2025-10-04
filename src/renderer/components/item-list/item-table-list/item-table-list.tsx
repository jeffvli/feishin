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
    useMemo,
    useRef,
    useState,
} from 'react';
import { type CellComponentProps, Grid, GridImperativeAPI, type GridProps } from 'react-window-v2';

import styles from './item-table-list.module.css';

import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { useItemListState } from '/@/renderer/components/item-list/helpers/item-list-state';
import { sortTableColumns } from '/@/renderer/components/item-list/helpers/sort-table-columns';
import { LibraryItem } from '/@/shared/types/domain-types';
import { TableColumn } from '/@/shared/types/types';

export interface CellProps {
    columns: ItemTableListColumnConfig[];
    data: unknown[];
    enableHeader?: boolean;
    enableRowBorders?: boolean;
    handleExpand: (e: MouseEvent<HTMLDivElement>, item: unknown, itemType: LibraryItem) => void;
    itemType: LibraryItem;
    size?: 'compact' | 'default';
}

export interface ItemTableListColumnConfig {
    align: 'center' | 'end' | 'start';
    id: TableColumn;
    pinned: 'left' | 'right' | null;
    width: number;
}

interface ItemTableListProps {
    CellComponent: JSXElementConstructor<CellComponentProps<CellProps>>;
    columns: ItemTableListColumnConfig[];
    data: unknown[];
    enableExpansion?: boolean;
    enableHeader?: boolean;
    enableRowBorders?: boolean;
    enableSelection?: boolean;
    headerHeight?: number;
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
    size?: 'compact' | 'default';
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
    columns,
    data,
    enableHeader = true,
    enableRowBorders = false,
    headerHeight = 40,
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
    size = 'default',
    totalItemCount,
}: ItemTableListProps) => {
    const sortedColumns = useMemo(() => sortTableColumns(columns), [columns]);
    const columnCount = sortedColumns.length;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const columnWidth = (index: number, _cellProps: CellProps) => sortedColumns[index].width;
    const pinnedLeftColumnCount = sortedColumns.filter((col) => col.pinned === 'left').length;
    const pinnedRightColumnCount = sortedColumns.filter((col) => col.pinned === 'right').length;

    const pinnedRowCount = enableHeader ? 1 : 0;
    const totalRowCount = totalItemCount - pinnedRowCount;
    const totalColumnCount = columnCount - pinnedLeftColumnCount - pinnedRightColumnCount;
    const pinnedRowRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const pinnedLeftColumnRef = useRef<HTMLDivElement>(null);
    const pinnedRightColumnRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const mergedRowRef = useMergedRef(rowRef, scrollContainerRef);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(false);

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
        const header = pinnedRowRef.current?.childNodes[0] as HTMLDivElement;
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;
        const pinnedLeft = pinnedLeftColumnRef.current?.childNodes[0] as HTMLDivElement;
        const pinnedRight = pinnedRightColumnRef.current?.childNodes[0] as HTMLDivElement;

        if (row) {
            // Ensure all containers have the same height
            const syncHeights = () => {
                const rowHeight = row.scrollHeight;
                let targetHeight = rowHeight;

                if (pinnedLeft) {
                    const pinnedLeftHeight = pinnedLeft.scrollHeight;
                    targetHeight = Math.max(targetHeight, pinnedLeftHeight);
                }

                if (pinnedRight) {
                    const pinnedRightHeight = pinnedRight.scrollHeight;
                    targetHeight = Math.max(targetHeight, pinnedRightHeight);
                }

                // Set consistent heights for all elements
                if (pinnedLeft && pinnedLeft.style.height !== `${targetHeight}px`) {
                    pinnedLeft.style.height = `${targetHeight}px`;
                }
                if (pinnedRight && pinnedRight.style.height !== `${targetHeight}px`) {
                    pinnedRight.style.height = `${targetHeight}px`;
                }
                if (row.style.height !== `${targetHeight}px`) {
                    row.style.height = `${targetHeight}px`;
                }
            };

            const timeoutId = setTimeout(syncHeights, 0);

            const activeElement = { element: null } as { element: HTMLDivElement | null };
            const scrollingElements = new Set<HTMLDivElement>();
            const scrollTimeouts = new Map<HTMLDivElement, NodeJS.Timeout>();

            const setActiveElement = (e: HTMLElementEventMap['pointermove']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };
            const setActiveElementFromWheel = (e: HTMLElementEventMap['wheel']) => {
                activeElement.element = e.currentTarget as HTMLDivElement;
            };

            // Track which elements are actively scrolling
            const markElementAsScrolling = (element: HTMLDivElement) => {
                scrollingElements.add(element);

                // Clear existing timeout for this element
                const existingTimeout = scrollTimeouts.get(element);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                }

                // Set a timeout to remove the element from scrolling set
                const timeout = setTimeout(() => {
                    scrollingElements.delete(element);
                    scrollTimeouts.delete(element);
                }, 150);

                scrollTimeouts.set(element, timeout);
            };

            const syncScroll = (e: HTMLElementEventMap['scroll']) => {
                const currentElement = e.currentTarget as HTMLDivElement;

                markElementAsScrolling(currentElement);

                // Allow sync if:
                // 1. Current element is the active element (normal case)
                // 2. Current element is actively scrolling (handles autoscroll and other continuous scrolling)
                const shouldSync =
                    currentElement === activeElement.element ||
                    scrollingElements.has(currentElement);

                if (!shouldSync) {
                    return;
                }

                const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
                const scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;

                // Prevent recursive scroll events
                const isScrolling = {
                    header: false,
                    pinnedLeft: false,
                    pinnedRight: false,
                    row: false,
                };

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

                // Sync from main content to header and sticky columns
                if (
                    e.currentTarget === row &&
                    !isScrolling.header &&
                    !isScrolling.pinnedLeft &&
                    !isScrolling.pinnedRight
                ) {
                    if (header) {
                        isScrolling.header = true;
                        header.scrollTo({
                            behavior: 'instant',
                            left: scrollLeft,
                        });
                    }
                    if (pinnedLeft) {
                        isScrolling.pinnedLeft = true;
                        pinnedLeft.scrollTo({
                            behavior: 'instant',
                            top: scrollTop,
                        });
                    }
                    if (pinnedRight) {
                        isScrolling.pinnedRight = true;
                        pinnedRight.scrollTo({
                            behavior: 'instant',
                            top: scrollTop,
                        });
                    }
                    setTimeout(() => {
                        isScrolling.header = false;
                        isScrolling.pinnedLeft = false;
                        isScrolling.pinnedRight = false;
                    }, 0);
                }

                // Sync vertical scroll between left pinned column and main content (only if pinnedLeft exists)
                if (pinnedLeft && e.currentTarget === pinnedLeft && !isScrolling.row) {
                    isScrolling.row = true;
                    row.scrollTo({
                        behavior: 'instant',
                        top: scrollTop,
                    });
                    setTimeout(() => {
                        isScrolling.row = false;
                    }, 0);
                }

                // Sync vertical scroll between right pinned column and main content (only if pinnedRight exists)
                if (pinnedRight && e.currentTarget === pinnedRight && !isScrolling.row) {
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
            if (pinnedLeft) {
                pinnedLeft.addEventListener('pointermove', setActiveElement);
                pinnedLeft.addEventListener('wheel', setActiveElementFromWheel);
                pinnedLeft.addEventListener('scroll', syncScroll);
            }
            if (pinnedRight) {
                pinnedRight.addEventListener('pointermove', setActiveElement);
                pinnedRight.addEventListener('wheel', setActiveElementFromWheel);
                pinnedRight.addEventListener('scroll', syncScroll);
            }

            // Add resize observer to maintain height sync
            const resizeObserver = new ResizeObserver(() => {
                syncHeights();
            });

            resizeObserver.observe(row);
            if (pinnedLeft) {
                resizeObserver.observe(pinnedLeft);
            }
            if (pinnedRight) {
                resizeObserver.observe(pinnedRight);
            }

            return () => {
                clearTimeout(timeoutId);
                scrollTimeouts.forEach((timeout) => clearTimeout(timeout));
                scrollTimeouts.clear();
                scrollingElements.clear();

                if (header) {
                    header.removeEventListener('pointermove', setActiveElement);
                    header.removeEventListener('wheel', setActiveElementFromWheel);
                    header.removeEventListener('scroll', syncScroll);
                }
                row.removeEventListener('pointermove', setActiveElement);
                row.removeEventListener('wheel', setActiveElementFromWheel);
                row.removeEventListener('scroll', syncScroll);
                if (pinnedLeft) {
                    pinnedLeft.removeEventListener('pointermove', setActiveElement);
                    pinnedLeft.removeEventListener('wheel', setActiveElementFromWheel);
                    pinnedLeft.removeEventListener('scroll', syncScroll);
                }
                if (pinnedRight) {
                    pinnedRight.removeEventListener('pointermove', setActiveElement);
                    pinnedRight.removeEventListener('wheel', setActiveElementFromWheel);
                    pinnedRight.removeEventListener('scroll', syncScroll);
                }
                resizeObserver.disconnect();
            };
        }

        return undefined;
    }, []);

    // Handle left and right shadow visibility based on horizontal scroll
    useEffect(() => {
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;

        if (!row) {
            setShowLeftShadow(false);
            setShowRightShadow(false);
            return;
        }

        const checkScrollPosition = () => {
            const scrollLeft = row.scrollLeft;
            const maxScrollLeft = row.scrollWidth - row.clientWidth;

            setShowLeftShadow(pinnedLeftColumnCount > 0 && scrollLeft > 0);
            setShowRightShadow(pinnedRightColumnCount > 0 && scrollLeft < maxScrollLeft);
        };

        checkScrollPosition();

        row.addEventListener('scroll', checkScrollPosition);

        return () => {
            row.removeEventListener('scroll', checkScrollPosition);
        };
    }, [pinnedLeftColumnCount, pinnedRightColumnCount]);

    const getRowHeight = useCallback(
        (index: number, cellProps: CellProps) => {
            const baseHeight =
                typeof rowHeight === 'number' ? rowHeight : rowHeight(index, cellProps);

            // If enableHeader is true and this is the first sticky row, use fixed header height
            if (enableHeader && index === 0 && pinnedRowCount > 0) {
                return headerHeight;
            }

            return baseHeight;
        },
        [enableHeader, headerHeight, rowHeight, pinnedRowCount],
    );

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
            onRangeChanged?.({
                endIndex: cells.rowStopIndex,
                startIndex: cells.rowStartIndex,
            });

            return onCellsRendered
                ? ({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }) => {
                      return onCellsRendered!(
                          {
                              columnStartIndex: columnStartIndex + pinnedLeftColumnCount,
                              columnStopIndex: columnStopIndex + pinnedLeftColumnCount,
                              rowStartIndex: rowStartIndex + pinnedRowCount,
                              rowStopIndex: rowStopIndex + pinnedRowCount,
                          },
                          cells,
                      );
                  }
                : undefined;
        },
        [onCellsRendered, onRangeChanged, pinnedLeftColumnCount, pinnedRowCount],
    );

    const PinnedRowCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + pinnedLeftColumnCount}
                />
            );
        },
        [pinnedLeftColumnCount, CellComponent],
    );

    const PinnedColumnCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return <CellComponent {...cellProps} rowIndex={cellProps.rowIndex + pinnedRowCount} />;
        },
        [pinnedRowCount, CellComponent],
    );

    const PinnedRightColumnCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + pinnedLeftColumnCount + totalColumnCount}
                    rowIndex={cellProps.rowIndex + pinnedRowCount}
                />
            );
        },
        [pinnedLeftColumnCount, pinnedRowCount, totalColumnCount, CellComponent],
    );

    const PinnedRightIntersectionCell = useCallback(
        (cellProps: CellComponentProps & CellProps) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + pinnedLeftColumnCount + totalColumnCount}
                />
            );
        },
        [pinnedLeftColumnCount, totalColumnCount, CellComponent],
    );

    const RowCell = useCallback(
        (cellProps: CellComponentProps<CellProps>) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + pinnedLeftColumnCount}
                    // onClick={(e) => {
                    //     onItemClick?.(cellProps.data[cellProps.rowIndex], cellProps.rowIndex, e);
                    // }}
                    rowIndex={cellProps.rowIndex + pinnedRowCount}
                />
            );
        },
        [pinnedLeftColumnCount, pinnedRowCount, CellComponent],
    );

    const cellProps = {
        columns: sortedColumns,
        data,
        enableHeader,
        enableRowBorders,
        handleExpand,
        itemType,
        size,
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
            className={styles.itemTableListContainer}
            initial={{ opacity: 0 }}
        >
            <div className={styles.itemTableContainer}>
                <div
                    className={styles.itemTablePinnedColumnsGridContainer}
                    style={{
                        minWidth: `${Array.from({ length: pinnedLeftColumnCount }, () => 0).reduce(
                            (a, _, i) => a + columnWidth(i, cellProps),
                            0,
                        )}px`,
                    }}
                >
                    {!!(pinnedLeftColumnCount || pinnedRowCount) && (
                        <div
                            className={clsx(styles.itemTablePinnedIntersectionGridContainer, {
                                [styles.withHeader]: enableHeader,
                            })}
                            style={{
                                minHeight: `${Array.from(
                                    { length: pinnedRowCount },
                                    () => 0,
                                ).reduce((a, _, i) => a + getRowHeight(i, cellProps), 0)}px`,
                            }}
                        >
                            <Grid
                                cellComponent={CellComponent as any}
                                cellProps={cellProps}
                                className={styles.noScrollbar}
                                columnCount={pinnedLeftColumnCount}
                                columnWidth={columnWidth}
                                rowCount={pinnedRowCount}
                                rowHeight={getRowHeight}
                            />
                            {enableHeader && <div className={styles.itemTablePinnedHeaderShadow} />}
                        </div>
                    )}
                    {!!pinnedLeftColumnCount && (
                        <div
                            className={styles.itemTablePinnedColumnsContainer}
                            ref={pinnedLeftColumnRef}
                        >
                            <Grid
                                cellComponent={PinnedColumnCell}
                                cellProps={cellProps}
                                className={clsx(styles.noScrollbar, styles.height100)}
                                columnCount={pinnedLeftColumnCount}
                                columnWidth={columnWidth}
                                rowCount={totalRowCount}
                                rowHeight={(index, cellProps) => {
                                    return getRowHeight(index + pinnedRowCount, cellProps);
                                }}
                            />
                        </div>
                    )}
                </div>
                <div className={styles.itemTablePinnedRowsContainer}>
                    {!!pinnedRowCount && (
                        <div
                            className={clsx(styles.itemTablePinnedRowsGridContainer, {
                                [styles.withHeader]: enableHeader,
                            })}
                            ref={pinnedRowRef}
                            style={
                                {
                                    '--header-height': `${headerHeight}px`,
                                    minHeight: `${Array.from(
                                        { length: pinnedRowCount },
                                        () => 0,
                                    ).reduce((a, _, i) => a + getRowHeight(i, cellProps), 0)}px`,
                                } as React.CSSProperties
                            }
                        >
                            <Grid
                                cellComponent={PinnedRowCell}
                                cellProps={cellProps}
                                className={styles.noScrollbar}
                                columnCount={totalColumnCount}
                                columnWidth={(index, cellProps) => {
                                    return columnWidth(index + pinnedLeftColumnCount, cellProps);
                                }}
                                rowCount={Array.from({ length: pinnedRowCount }, () => 0).length}
                                rowHeight={getRowHeight}
                            />
                            {enableHeader && <div className={styles.itemTablePinnedHeaderShadow} />}
                        </div>
                    )}
                    <div className={styles.itemTableGridContainer} ref={mergedRowRef}>
                        <Grid
                            cellComponent={RowCell}
                            cellProps={cellProps}
                            className={styles.height100}
                            columnCount={totalColumnCount}
                            columnWidth={(index, cellProps) => {
                                return columnWidth(index + pinnedLeftColumnCount, cellProps);
                            }}
                            onCellsRendered={handleOnCellsRendered}
                            rowCount={totalRowCount}
                            rowHeight={(index, cellProps) => {
                                return getRowHeight(index + pinnedRowCount, cellProps);
                            }}
                        />
                        {pinnedLeftColumnCount > 0 && showLeftShadow && (
                            <div className={styles.itemTableLeftScrollShadow} />
                        )}
                        {pinnedRightColumnCount > 0 && showRightShadow && (
                            <div className={styles.itemTableRightScrollShadow} />
                        )}
                    </div>
                </div>
                {!!pinnedRightColumnCount && (
                    <div
                        className={styles.itemTablePinnedColumnsGridContainer}
                        style={{
                            minWidth: `${Array.from(
                                { length: pinnedRightColumnCount },
                                () => 0,
                            ).reduce(
                                (a, _, i) =>
                                    a +
                                    columnWidth(
                                        i + pinnedLeftColumnCount + totalColumnCount,
                                        cellProps,
                                    ),
                                0,
                            )}px`,
                        }}
                    >
                        {!!(pinnedRightColumnCount || pinnedRowCount) && (
                            <div
                                className={clsx(styles.itemTablePinnedIntersectionGridContainer, {
                                    [styles.withHeader]: enableHeader,
                                })}
                                style={{
                                    minHeight: `${Array.from(
                                        { length: pinnedRowCount },
                                        () => 0,
                                    ).reduce((a, _, i) => a + getRowHeight(i, cellProps), 0)}px`,
                                }}
                            >
                                <Grid
                                    cellComponent={PinnedRightIntersectionCell}
                                    cellProps={cellProps}
                                    className={styles.noScrollbar}
                                    columnCount={pinnedRightColumnCount}
                                    columnWidth={(index, cellProps) => {
                                        return columnWidth(
                                            index + pinnedLeftColumnCount + totalColumnCount,
                                            cellProps,
                                        );
                                    }}
                                    rowCount={pinnedRowCount}
                                    rowHeight={getRowHeight}
                                />
                                {enableHeader && (
                                    <div className={styles.itemTablePinnedHeaderShadow} />
                                )}
                            </div>
                        )}
                        <div
                            className={styles.itemTablePinnedRightColumnsContainer}
                            ref={pinnedRightColumnRef}
                        >
                            <Grid
                                cellComponent={PinnedRightColumnCell}
                                cellProps={cellProps}
                                className={clsx(styles.noScrollbar, styles.height100)}
                                columnCount={pinnedRightColumnCount}
                                columnWidth={(index, cellProps) => {
                                    return columnWidth(
                                        index + pinnedLeftColumnCount + totalColumnCount,
                                        cellProps,
                                    );
                                }}
                                rowCount={totalRowCount}
                                rowHeight={(index, cellProps) => {
                                    return getRowHeight(index + pinnedRowCount, cellProps);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
            <AnimatePresence initial={false}>
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
