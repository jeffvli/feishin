// Component adapted from https://github.com/bvaughn/react-window/issues/826

import { useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import {
    type JSXElementConstructor,
    Ref,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { type CellComponentProps, Grid, type GridProps } from 'react-window-v2';

import styles from './item-table-list.module.css';

import { ExpandedListContainer } from '/@/renderer/components/item-list/expanded-list-container';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import {
    ItemListStateActions,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { parseTableColumns } from '/@/renderer/components/item-list/helpers/parse-table-columns';
import { ItemListHandle, ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { LibraryItem } from '/@/shared/types/domain-types';

export interface TableItemProps {
    cellPadding?: ItemTableListProps['cellPadding'];
    columns: ItemTableListColumnConfig[];
    data: ItemTableListProps['data'];
    enableAlternateRowColors?: ItemTableListProps['enableAlternateRowColors'];
    enableExpansion?: ItemTableListProps['enableExpansion'];
    enableHeader?: ItemTableListProps['enableHeader'];
    enableHorizontalBorders?: ItemTableListProps['enableHorizontalBorders'];
    enableRowHoverHighlight?: ItemTableListProps['enableRowHoverHighlight'];
    enableSelection?: ItemTableListProps['enableSelection'];
    enableVerticalBorders?: ItemTableListProps['enableVerticalBorders'];
    getRowHeight: (index: number, cellProps: TableItemProps) => number;
    internalState: ItemListStateActions;
    itemType: ItemTableListProps['itemType'];
    size?: ItemTableListProps['size'];
}

interface ItemTableListProps {
    CellComponent: JSXElementConstructor<CellComponentProps<TableItemProps>>;
    cellPadding?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    columns: ItemTableListColumnConfig[];
    data: unknown[];
    enableAlternateRowColors?: boolean;
    enableExpansion?: boolean;
    enableHeader?: boolean;
    enableHorizontalBorders?: boolean;
    enableRowHoverHighlight?: boolean;
    enableSelection?: boolean;
    enableVerticalBorders?: boolean;
    headerHeight?: number;
    initialTop?: {
        behavior?: 'auto' | 'smooth';
        to: number;
        type: 'index' | 'offset';
    };
    itemType: LibraryItem;
    onCellsRendered?: GridProps<TableItemProps>['onCellsRendered'];
    onEndReached?: (index: number, internalState: ItemListStateActions) => void;
    onRangeChanged?: (
        range: { endIndex: number; startIndex: number },
        internalState: ItemListStateActions,
    ) => void;
    onScrollEnd?: (offset: number, internalState: ItemListStateActions) => void;
    onStartReached?: (index: number, internalState: ItemListStateActions) => void;
    ref?: Ref<ItemListHandle>;
    rowHeight?: ((index: number, cellProps: TableItemProps) => number) | number;
    size?: 'compact' | 'default' | 'large';
}

export const ItemTableList = ({
    CellComponent,
    cellPadding = 'sm',
    columns,
    data,
    enableAlternateRowColors = false,
    enableExpansion = true,
    enableHeader = true,
    enableHorizontalBorders = false,
    enableRowHoverHighlight = true,
    enableSelection = true,
    enableVerticalBorders = false,
    headerHeight = 40,
    initialTop,
    itemType,
    onCellsRendered,
    onEndReached,
    onRangeChanged,
    onScrollEnd,
    onStartReached,
    ref,
    rowHeight,
    size = 'default',
}: ItemTableListProps) => {
    const totalItemCount = enableHeader ? data.length + 1 : data.length;
    const parsedColumns = useMemo(() => parseTableColumns(columns), [columns]);
    const columnCount = parsedColumns.length;

    const [centerContainerWidth, setCenterContainerWidth] = useState(0);

    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;

        const updateWidth = () => {
            setCenterContainerWidth(el.clientWidth || 0);
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(() => {
            updateWidth();
        });

        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Compute distributed widths: unpinned columns with autoWidth will share any remaining space
    const calculatedColumnWidths = useMemo(() => {
        const baseWidths = parsedColumns.map((c) => c.width);
        const distributed = baseWidths.slice();

        // Identify unpinned columns and auto-width candidates
        const unpinnedIndices: number[] = [];
        const autoUnpinnedIndices: number[] = [];

        parsedColumns.forEach((col, idx) => {
            if (col.pinned === null) {
                unpinnedIndices.push(idx);
                if (col.autoSize) {
                    autoUnpinnedIndices.push(idx);
                }
            }
        });

        if (unpinnedIndices.length === 0 || autoUnpinnedIndices.length === 0) {
            return distributed;
        }

        const unpinnedBaseTotal = unpinnedIndices.reduce((sum, idx) => sum + baseWidths[idx], 0);

        // Distribute only when there is extra space within the center container
        const extra = Math.max(0, centerContainerWidth - unpinnedBaseTotal);
        if (extra <= 0) {
            return distributed;
        }

        const extraPer = extra / autoUnpinnedIndices.length;
        autoUnpinnedIndices.forEach((idx) => {
            distributed[idx] = baseWidths[idx] + extraPer;
        });

        return distributed;
    }, [parsedColumns, centerContainerWidth]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const columnWidth = (index: number, _cellProps: TableItemProps) =>
        calculatedColumnWidths[index];
    const pinnedLeftColumnCount = parsedColumns.filter((col) => col.pinned === 'left').length;
    const pinnedRightColumnCount = parsedColumns.filter((col) => col.pinned === 'right').length;

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
    const handleRef = useRef<ItemListHandle | null>(null);

    const onScrollEndRef = useRef<ItemTableListProps['onScrollEnd']>(onScrollEnd);
    useEffect(() => {
        onScrollEndRef.current = onScrollEnd;
    }, [onScrollEnd]);

    const scrollToTableOffset = useCallback((offset: number) => {
        const mainContainer = rowRef.current?.childNodes[0] as HTMLDivElement | undefined;
        const pinnedLeftContainer = pinnedLeftColumnRef.current?.childNodes[0] as
            | HTMLDivElement
            | undefined;
        const pinnedRightContainer = pinnedRightColumnRef.current?.childNodes[0] as
            | HTMLDivElement
            | undefined;

        if (mainContainer) {
            mainContainer.scrollTo({ behavior: 'instant', top: offset });
        }
        if (pinnedLeftContainer) {
            pinnedLeftContainer.scrollTo({ behavior: 'instant', top: offset });
        }
        if (pinnedRightContainer) {
            pinnedRightContainer.scrollTo({ behavior: 'instant', top: offset });
        }
    }, []);

    const calculateScrollTopForIndex = useCallback(
        (index: number) => {
            const adjustedIndex = enableHeader ? Math.max(0, index - 1) : index;
            let scrollTop = 0;
            for (let i = 0; i < adjustedIndex; i++) {
                const height = rowHeight as number;
                scrollTop += height;
            }
            return scrollTop;
        },
        [enableHeader, rowHeight],
    );

    const scrollToTableIndex = useCallback(
        (index: number) => {
            const offset = calculateScrollTopForIndex(index);
            scrollToTableOffset(offset);
        },
        [calculateScrollTopForIndex, scrollToTableOffset],
    );

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

                    if (element === row && onScrollEndRef.current) {
                        onScrollEndRef.current(
                            row.scrollTop,
                            handleRef.current ?? (undefined as any),
                        );
                    }
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
        (index: number, cellProps: TableItemProps) => {
            const height = size === 'compact' ? 40 : size === 'large' ? 88 : 64;

            const baseHeight =
                typeof rowHeight === 'number' ? rowHeight : rowHeight?.(index, cellProps) || height;

            // If enableHeader is true and this is the first sticky row, use fixed header height
            if (enableHeader && index === 0 && pinnedRowCount > 0) {
                return headerHeight;
            }

            return baseHeight;
        },
        [enableHeader, headerHeight, rowHeight, pinnedRowCount, size],
    );

    const internalState = useItemListState();

    const hasExpanded = internalState.hasExpanded();

    const handleOnCellsRendered = useCallback(
        (cells: {
            columnStartIndex: number;
            columnStopIndex: number;
            rowStartIndex: number;
            rowStopIndex: number;
        }) => {
            onRangeChanged?.(
                {
                    endIndex: cells.rowStopIndex,
                    startIndex: cells.rowStartIndex,
                },
                internalState,
            );

            if (onStartReached || onEndReached) {
                if (cells.rowStartIndex === 0) {
                    onStartReached?.(0, handleRef.current ?? (undefined as any));
                }

                if (cells.rowStopIndex + 10 >= totalItemCount) {
                    onEndReached?.(totalItemCount, handleRef.current ?? (undefined as any));
                }
            }

            if (onCellsRendered) {
                return ({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }) => {
                    return onCellsRendered!(
                        {
                            columnStartIndex: columnStartIndex + pinnedLeftColumnCount,
                            columnStopIndex: columnStopIndex + pinnedLeftColumnCount,
                            rowStartIndex: rowStartIndex + pinnedRowCount,
                            rowStopIndex: rowStopIndex + pinnedRowCount,
                        },
                        cells,
                    );
                };
            }

            return undefined;
        },
        [
            onCellsRendered,
            onEndReached,
            onRangeChanged,
            onStartReached,
            pinnedLeftColumnCount,
            pinnedRowCount,
            totalItemCount,
            internalState,
        ],
    );

    const PinnedRowCell = useCallback(
        (cellProps: CellComponentProps & TableItemProps) => {
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
        (cellProps: CellComponentProps & TableItemProps) => {
            return <CellComponent {...cellProps} rowIndex={cellProps.rowIndex + pinnedRowCount} />;
        },
        [pinnedRowCount, CellComponent],
    );

    const PinnedRightColumnCell = useCallback(
        (cellProps: CellComponentProps & TableItemProps) => {
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
        (cellProps: CellComponentProps & TableItemProps) => {
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
        (cellProps: CellComponentProps<TableItemProps>) => {
            return (
                <CellComponent
                    {...cellProps}
                    columnIndex={cellProps.columnIndex + pinnedLeftColumnCount}
                    rowIndex={cellProps.rowIndex + pinnedRowCount}
                />
            );
        },
        [pinnedLeftColumnCount, pinnedRowCount, CellComponent],
    );

    const itemProps: TableItemProps = {
        cellPadding,
        columns: parsedColumns,
        data: enableHeader ? [null, ...data] : data,
        enableAlternateRowColors,
        enableExpansion,
        enableHeader,
        enableHorizontalBorders,
        enableRowHoverHighlight,
        enableSelection,
        enableVerticalBorders,
        getRowHeight,
        internalState,
        itemType,
        size,
    };

    const isInitialScrollPositionSet = useRef<boolean>(false);

    useEffect(() => {
        if (!initialTop || isInitialScrollPositionSet.current) return;
        isInitialScrollPositionSet.current = true;

        if (initialTop.type === 'offset') {
            scrollToTableOffset(initialTop.to);
        } else {
            scrollToTableIndex(initialTop.to);
        }
    }, [initialTop, scrollToTableIndex, scrollToTableOffset]);

    const imperativeHandle: ItemListHandle = useMemo(() => {
        return {
            clearExpanded: () => {
                internalState.clearExpanded();
            },
            clearSelected: () => {
                internalState.clearSelected();
            },
            getItem: (index: number) => (enableHeader ? data[index - 1] : data[index]),
            getItemCount: () => (enableHeader ? data.length : data.length),
            getItems: () => data,
            internalState,
            scrollToIndex: (index: number) => {
                scrollToTableIndex(enableHeader ? index + 1 : index);
            },
            scrollToOffset: (offset: number) => {
                scrollToTableOffset(offset);
            },
        };
    }, [data, enableHeader, internalState, scrollToTableIndex, scrollToTableOffset]);

    useImperativeHandle(ref, () => imperativeHandle);

    useEffect(() => {
        handleRef.current = imperativeHandle;
    }, [imperativeHandle]);

    return (
        <div className={styles.itemTableListContainer}>
            <div className={styles.itemTableContainer}>
                <div
                    className={styles.itemTablePinnedColumnsGridContainer}
                    style={{
                        minWidth: `${Array.from({ length: pinnedLeftColumnCount }, () => 0).reduce(
                            (a, _, i) => a + columnWidth(i, itemProps),
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
                                ).reduce((a, _, i) => a + getRowHeight(i, itemProps), 0)}px`,
                            }}
                        >
                            <Grid
                                cellComponent={CellComponent as any}
                                cellProps={itemProps}
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
                                cellProps={itemProps}
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
                                    ).reduce((a, _, i) => a + getRowHeight(i, itemProps), 0)}px`,
                                } as React.CSSProperties
                            }
                        >
                            <Grid
                                cellComponent={PinnedRowCell}
                                cellProps={itemProps}
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
                            cellProps={itemProps}
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
                                        itemProps,
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
                                    ).reduce((a, _, i) => a + getRowHeight(i, itemProps), 0)}px`,
                                }}
                            >
                                <Grid
                                    cellComponent={PinnedRightIntersectionCell}
                                    cellProps={itemProps}
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
                                cellProps={itemProps}
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
                    <ExpandedListContainer>
                        <ExpandedListItem internalState={internalState} itemType={itemType} />
                    </ExpandedListContainer>
                )}
            </AnimatePresence>
        </div>
    );
};
