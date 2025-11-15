// Component adapted from https://github.com/bvaughn/react-window/issues/826

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { useMergedRef } from '@mantine/hooks';
import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import React, {
    type JSXElementConstructor,
    Ref,
    useCallback,
    useEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { type CellComponentProps, Grid } from 'react-window-v2';

import styles from './item-table-list.module.css';

import { ExpandedListContainer } from '/@/renderer/components/item-list/expanded-list-container';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { createExtractRowId } from '/@/renderer/components/item-list/helpers/extract-row-id';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    ItemListStateItemWithRequiredProperties,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { parseTableColumns } from '/@/renderer/components/item-list/helpers/parse-table-columns';
import {
    ItemControls,
    ItemListHandle,
    ItemTableListColumnConfig,
} from '/@/renderer/components/item-list/types';
import { PlayerContext, usePlayer } from '/@/renderer/features/player/context/player-context';
import { LibraryItem } from '/@/shared/types/domain-types';
import { TableColumn } from '/@/shared/types/types';

/**
 * Type guard to check if an item has the required properties (id and serverId)
 * Similar to the type guard used in ItemCard
 */
const hasRequiredItemProperties = (item: unknown): item is { id: string; serverId: string } => {
    return (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof (item as any).id === 'string' &&
        'serverId' in item &&
        typeof (item as any).serverId === 'string'
    );
};

/**
 * Type guard to check if an item has the required properties for ItemListStateItemWithRequiredProperties
 */
const hasRequiredStateItemProperties = (
    item: unknown,
): item is ItemListStateItemWithRequiredProperties => {
    return (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof (item as any).id === 'string' &&
        '_serverId' in item &&
        typeof (item as any)._serverId === 'string' &&
        '_itemType' in item &&
        typeof (item as any)._itemType === 'string' &&
        'rowId' in item &&
        typeof (item as any).rowId === 'string'
    );
};

enum TableItemSize {
    COMPACT = 40,
    DEFAULT = 64,
    LARGE = 88,
}

interface VirtualizedTableGridProps {
    calculatedColumnWidths: number[];
    CellComponent: JSXElementConstructor<CellComponentProps<TableItemProps>>;
    cellPadding: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    controls: ItemControls;
    data: unknown[];
    enableAlternateRowColors: boolean;
    enableColumnReorder: boolean;
    enableColumnResize: boolean;
    enableDrag?: boolean;
    enableExpansion: boolean;
    enableHeader: boolean;
    enableHorizontalBorders: boolean;
    enableRowHoverHighlight: boolean;
    enableSelection: boolean;
    enableVerticalBorders: boolean;
    getRowHeight: (index: number, cellProps: TableItemProps) => number;
    headerHeight: number;
    internalState: ItemListStateActions;
    itemType: LibraryItem;
    mergedRowRef: React.Ref<HTMLDivElement>;
    onRangeChanged?: ItemTableListProps['onRangeChanged'];
    parsedColumns: ReturnType<typeof parseTableColumns>;
    pinnedLeftColumnCount: number;
    pinnedLeftColumnRef: React.RefObject<HTMLDivElement>;
    pinnedRightColumnCount: number;
    pinnedRightColumnRef: React.RefObject<HTMLDivElement>;
    pinnedRowCount: number;
    pinnedRowRef: React.RefObject<HTMLDivElement>;
    playerContext: PlayerContext;
    showLeftShadow: boolean;
    showRightShadow: boolean;
    showTopShadow: boolean;
    size: 'compact' | 'default' | 'large';
    tableId: string;
    totalColumnCount: number;
    totalRowCount: number;
}

const VirtualizedTableGrid = React.memo(
    ({
        calculatedColumnWidths,
        CellComponent,
        cellPadding,
        controls,
        data,
        enableAlternateRowColors,
        enableColumnReorder,
        enableColumnResize,
        enableDrag,
        enableExpansion,
        enableHeader,
        enableHorizontalBorders,
        enableRowHoverHighlight,
        enableSelection,
        enableVerticalBorders,
        getRowHeight,
        headerHeight,
        internalState,
        itemType,
        mergedRowRef,
        onRangeChanged,
        parsedColumns,
        pinnedLeftColumnCount,
        pinnedLeftColumnRef,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        pinnedRowCount,
        pinnedRowRef,
        playerContext,
        showLeftShadow,
        showRightShadow,
        showTopShadow,
        size,
        tableId,
        totalColumnCount,
        totalRowCount,
    }: VirtualizedTableGridProps) => {
        const columnWidth = useCallback(
            (index: number) => calculatedColumnWidths[index],
            [calculatedColumnWidths],
        );

        const itemProps: TableItemProps = useMemo(
            () => ({
                cellPadding,
                columns: parsedColumns,
                controls,
                data: enableHeader ? [null, ...data] : data,
                enableAlternateRowColors,
                enableColumnReorder,
                enableColumnResize,
                enableDrag,
                enableExpansion,
                enableHeader,
                enableHorizontalBorders,
                enableRowHoverHighlight,
                enableSelection,
                enableVerticalBorders,
                getRowHeight,
                internalState,
                itemType,
                playerContext,
                size,
                tableId,
            }),
            [
                cellPadding,
                controls,
                parsedColumns,
                enableHeader,
                data,
                enableAlternateRowColors,
                enableColumnReorder,
                enableColumnResize,
                enableDrag,
                enableExpansion,
                enableHorizontalBorders,
                enableRowHoverHighlight,
                enableSelection,
                enableVerticalBorders,
                getRowHeight,
                internalState,
                playerContext,
                itemType,
                size,
                tableId,
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
                return (
                    <CellComponent {...cellProps} rowIndex={cellProps.rowIndex + pinnedRowCount} />
                );
            },
            [pinnedRowCount, CellComponent],
        );

        const PinnedRightColumnCell = useCallback(
            (cellProps: CellComponentProps & TableItemProps) => {
                return (
                    <CellComponent
                        {...cellProps}
                        columnIndex={
                            cellProps.columnIndex + pinnedLeftColumnCount + totalColumnCount
                        }
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
                        columnIndex={
                            cellProps.columnIndex + pinnedLeftColumnCount + totalColumnCount
                        }
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

        const handleOnCellsRendered = useCallback(
            (items: {
                columnStartIndex: number;
                columnStopIndex: number;
                rowStartIndex: number;
                rowStopIndex: number;
            }) => {
                onRangeChanged?.({
                    startIndex: items.rowStartIndex,
                    stopIndex: items.rowStopIndex,
                });
            },
            [onRangeChanged],
        );

        return (
            <div className={styles.itemTableContainer}>
                <div
                    className={styles.itemTablePinnedColumnsGridContainer}
                    style={
                        {
                            '--header-height': `${headerHeight}px`,
                            minWidth: `${Array.from(
                                { length: pinnedLeftColumnCount },
                                () => 0,
                            ).reduce((a, _, i) => a + columnWidth(i), 0)}px`,
                        } as React.CSSProperties
                    }
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
                                overflow: 'hidden',
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
                        </div>
                    )}
                    {enableHeader && showTopShadow && (
                        <div className={styles.itemTableTopScrollShadow} />
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
                <div
                    className={styles.itemTablePinnedRowsContainer}
                    style={
                        {
                            '--header-height': `${headerHeight}px`,
                        } as React.CSSProperties
                    }
                >
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
                                    overflow: 'hidden',
                                } as React.CSSProperties
                            }
                        >
                            <Grid
                                cellComponent={PinnedRowCell}
                                cellProps={itemProps}
                                className={styles.noScrollbar}
                                columnCount={totalColumnCount}
                                columnWidth={(index) => {
                                    return columnWidth(index + pinnedLeftColumnCount);
                                }}
                                rowCount={Array.from({ length: pinnedRowCount }, () => 0).length}
                                rowHeight={getRowHeight}
                            />
                        </div>
                    )}
                    {enableHeader && showTopShadow && (
                        <div className={styles.itemTableTopScrollShadow} />
                    )}
                    <div className={styles.itemTableGridContainer} ref={mergedRowRef}>
                        <Grid
                            cellComponent={RowCell}
                            cellProps={itemProps}
                            className={styles.height100}
                            columnCount={totalColumnCount}
                            columnWidth={(index) => {
                                return columnWidth(index + pinnedLeftColumnCount);
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
                        style={
                            {
                                '--header-height': `${headerHeight}px`,
                                minWidth: `${Array.from(
                                    { length: pinnedRightColumnCount },
                                    () => 0,
                                ).reduce(
                                    (a, _, i) =>
                                        a +
                                        columnWidth(i + pinnedLeftColumnCount + totalColumnCount),
                                    0,
                                )}px`,
                            } as React.CSSProperties
                        }
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
                                    overflow: 'hidden',
                                }}
                            >
                                <Grid
                                    cellComponent={PinnedRightIntersectionCell}
                                    cellProps={itemProps}
                                    className={styles.noScrollbar}
                                    columnCount={pinnedRightColumnCount}
                                    columnWidth={(index) => {
                                        return columnWidth(
                                            index + pinnedLeftColumnCount + totalColumnCount,
                                        );
                                    }}
                                    rowCount={pinnedRowCount}
                                    rowHeight={getRowHeight}
                                />
                            </div>
                        )}
                        {enableHeader && showTopShadow && (
                            <div className={styles.itemTableTopScrollShadow} />
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
                                columnWidth={(index) => {
                                    return columnWidth(
                                        index + pinnedLeftColumnCount + totalColumnCount,
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
        );
    },
);

VirtualizedTableGrid.displayName = 'VirtualizedTableGrid';

export interface TableItemProps {
    cellPadding?: ItemTableListProps['cellPadding'];
    columns: ItemTableListColumnConfig[];
    controls: ItemControls;
    data: ItemTableListProps['data'];
    enableAlternateRowColors?: ItemTableListProps['enableAlternateRowColors'];
    enableColumnReorder?: boolean;
    enableColumnResize?: boolean;
    enableDrag?: ItemTableListProps['enableDrag'];
    enableExpansion?: ItemTableListProps['enableExpansion'];
    enableHeader?: ItemTableListProps['enableHeader'];
    enableHorizontalBorders?: ItemTableListProps['enableHorizontalBorders'];
    enableRowHoverHighlight?: ItemTableListProps['enableRowHoverHighlight'];
    enableSelection?: ItemTableListProps['enableSelection'];
    enableVerticalBorders?: ItemTableListProps['enableVerticalBorders'];
    getRowHeight: (index: number, cellProps: TableItemProps) => number;
    internalState: ItemListStateActions;
    itemType: ItemTableListProps['itemType'];
    onRowClick?: (item: any, event: React.MouseEvent<HTMLDivElement>) => void;
    playerContext: PlayerContext;
    size?: ItemTableListProps['size'];
    tableId: string;
}

interface ItemTableListProps {
    autoFitColumns?: boolean;
    CellComponent: JSXElementConstructor<CellComponentProps<TableItemProps>>;
    cellPadding?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    columns: ItemTableListColumnConfig[];
    currentPage?: number;
    data: unknown[];
    enableAlternateRowColors?: boolean;
    enableDrag?: boolean;
    enableExpansion?: boolean;
    enableHeader?: boolean;
    enableHorizontalBorders?: boolean;
    enableRowHoverHighlight?: boolean;
    enableSelection?: boolean;
    enableVerticalBorders?: boolean;
    getRowId?: ((item: unknown) => string) | string;
    headerHeight?: number;
    initialTop?: {
        behavior?: 'auto' | 'smooth';
        to: number;
        type: 'index' | 'offset';
    };
    itemType: LibraryItem;
    onColumnReordered?: (
        columnIdFrom: TableColumn,
        columnIdTo: TableColumn,
        edge: 'bottom' | 'left' | 'right' | 'top' | null,
    ) => void;
    onColumnResized?: (columnId: TableColumn, width: number) => void;
    onRangeChanged?: (range: { startIndex: number; stopIndex: number }) => void;
    onScrollEnd?: (offset: number, internalState: ItemListStateActions) => void;
    ref?: Ref<ItemListHandle>;
    rowHeight?: ((index: number, cellProps: TableItemProps) => number) | number;
    size?: 'compact' | 'default' | 'large';
}

export const ItemTableList = ({
    autoFitColumns = false,
    CellComponent,
    cellPadding = 'sm',
    columns,
    currentPage,
    data,
    enableAlternateRowColors = false,
    enableDrag = true,
    enableExpansion = true,
    enableHeader = true,
    enableHorizontalBorders = false,
    enableRowHoverHighlight = true,
    enableSelection = true,
    enableVerticalBorders = false,
    getRowId,
    headerHeight = 40,
    initialTop,
    itemType,
    onColumnReordered,
    onColumnResized,
    onRangeChanged,
    onScrollEnd,
    ref,
    rowHeight,
    size = 'default',
}: ItemTableListProps) => {
    const tableId = useId();
    const totalItemCount = enableHeader ? data.length + 1 : data.length;
    const parsedColumns = useMemo(() => parseTableColumns(columns), [columns]);
    const columnCount = parsedColumns.length;
    const playerContext = usePlayer();
    const [centerContainerWidth, setCenterContainerWidth] = useState(0);
    const [totalContainerWidth, setTotalContainerWidth] = useState(0);

    // Compute distributed widths: unpinned columns with autoWidth will share any remaining space
    // When autoSizeColumns is true, all column widths are treated as proportions and scaled to fit the container
    const calculatedColumnWidths = useMemo(() => {
        const baseWidths = parsedColumns.map((c) => c.width);

        // When autoSizeColumns is enabled, treat all widths as proportions and scale to fit container
        if (autoFitColumns) {
            // Calculate total reference width (sum of all base widths)
            const totalReferenceWidth = baseWidths.reduce((sum, width) => sum + width, 0);

            if (totalReferenceWidth === 0 || totalContainerWidth === 0) {
                return baseWidths.map((width) => Math.round(width));
            }

            // Scale factor to fit all columns proportionally within the total container width
            const scaleFactor = totalContainerWidth / totalReferenceWidth;

            // Apply scale factor to all columns proportionally and round to integers
            const scaledWidths = baseWidths.map((width) => Math.round(width * scaleFactor));

            // Adjust for rounding errors: ensure total equals totalContainerWidth
            const totalScaled = scaledWidths.reduce((sum, width) => sum + width, 0);
            const difference = totalContainerWidth - totalScaled;

            if (difference !== 0 && scaledWidths.length > 0) {
                // Distribute the difference to the largest columns
                const sortedIndices = scaledWidths
                    .map((width, idx) => ({ idx, width }))
                    .sort((a, b) => b.width - a.width);

                const adjustmentPerColumn = Math.sign(difference);
                const adjustmentCount = Math.abs(difference);

                for (let i = 0; i < adjustmentCount && i < sortedIndices.length; i++) {
                    scaledWidths[sortedIndices[i].idx] += adjustmentPerColumn;
                }
            }

            return scaledWidths;
        }

        // Original behavior: distribute extra space to auto-size columns
        const distributed = baseWidths.slice();

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
            return distributed.map((width) => Math.round(width));
        }

        const unpinnedBaseTotal = unpinnedIndices.reduce((sum, idx) => sum + baseWidths[idx], 0);

        // Distribute only when there is extra space within the center container
        const extra = Math.max(0, centerContainerWidth - unpinnedBaseTotal);
        if (extra <= 0) {
            return distributed.map((width) => Math.round(width));
        }

        const extraPer = extra / autoUnpinnedIndices.length;
        autoUnpinnedIndices.forEach((idx) => {
            distributed[idx] = Math.round(baseWidths[idx] + extraPer);
        });

        // Round all widths to integers
        return distributed.map((width) => Math.round(width));
    }, [parsedColumns, centerContainerWidth, autoFitColumns, totalContainerWidth]);

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
    const [showTopShadow, setShowTopShadow] = useState(false);
    const handleRef = useRef<ItemListHandle | null>(null);
    const containerFocusRef = useRef<HTMLDivElement | null>(null);

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

    // Track total container width for autoSizeColumns
    useEffect(() => {
        const el = containerFocusRef.current;
        if (!el || !autoFitColumns) return;

        const updateWidth = () => {
            setTotalContainerWidth(el.clientWidth || 0);
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(() => {
            updateWidth();
        });

        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
        };
    }, [autoFitColumns]);

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

        const behavior = 'instant';

        if (mainContainer) {
            mainContainer.scrollTo({ behavior, top: offset });
        }
        if (pinnedLeftContainer) {
            pinnedLeftContainer.scrollTo({ behavior, top: offset });
        }
        if (pinnedRightContainer) {
            pinnedRightContainer.scrollTo({ behavior, top: offset });
        }
    }, []);

    const DEFAULT_ROW_HEIGHT =
        size === 'compact'
            ? TableItemSize.COMPACT
            : size === 'large'
              ? TableItemSize.LARGE
              : TableItemSize.DEFAULT;

    const calculateScrollTopForIndex = useCallback(
        (index: number) => {
            const adjustedIndex = enableHeader ? Math.max(0, index - 1) : index;
            let scrollTop = 0;

            // Create a minimal mock cellProps for rowHeight function calls if needed
            const mockCellProps: TableItemProps = {
                cellPadding,
                columns: parsedColumns,
                controls: {} as ItemControls,
                data: enableHeader ? [null, ...data] : data,
                enableAlternateRowColors,
                enableExpansion,
                enableHeader,
                enableHorizontalBorders,
                enableRowHoverHighlight,
                enableSelection,
                enableVerticalBorders,
                getRowHeight: () => DEFAULT_ROW_HEIGHT,
                internalState: {} as ItemListStateActions,
                itemType,
                playerContext,
                size,
                tableId,
            };

            for (let i = 0; i < adjustedIndex; i++) {
                let height: number;
                if (typeof rowHeight === 'number') {
                    height = rowHeight;
                } else if (typeof rowHeight === 'function') {
                    height = rowHeight(i, mockCellProps);
                } else {
                    height = DEFAULT_ROW_HEIGHT;
                }
                scrollTop += height;
            }
            return scrollTop;
        },
        [
            enableHeader,
            cellPadding,
            parsedColumns,
            data,
            enableAlternateRowColors,
            enableExpansion,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            itemType,
            playerContext,
            size,
            tableId,
            DEFAULT_ROW_HEIGHT,
            rowHeight,
        ],
    );

    const scrollToTableIndex = useCallback(
        (index: number, options?: { align?: 'bottom' | 'center' | 'top' }) => {
            const mainContainer = rowRef.current?.childNodes[0] as HTMLDivElement | undefined;
            if (!mainContainer) return;

            const viewportHeight = mainContainer.clientHeight;
            const align = options?.align || 'top';

            // Calculate the base scroll offset (top of the row)
            let offset = calculateScrollTopForIndex(index);

            // Calculate row height for the target index
            const adjustedIndex = enableHeader ? Math.max(0, index - 1) : index;
            const mockCellProps: TableItemProps = {
                cellPadding,
                columns: parsedColumns,
                controls: {} as ItemControls,
                data: enableHeader ? [null, ...data] : data,
                enableAlternateRowColors,
                enableExpansion,
                enableHeader,
                enableHorizontalBorders,
                enableRowHoverHighlight,
                enableSelection,
                enableVerticalBorders,
                getRowHeight: () => DEFAULT_ROW_HEIGHT,
                internalState: {} as ItemListStateActions,
                itemType,
                playerContext,
                size,
                tableId,
            };

            let targetRowHeight: number;
            if (typeof rowHeight === 'number') {
                targetRowHeight = rowHeight;
            } else if (typeof rowHeight === 'function') {
                targetRowHeight = rowHeight(adjustedIndex, mockCellProps);
            } else {
                targetRowHeight = DEFAULT_ROW_HEIGHT;
            }

            // Adjust offset based on alignment
            if (align === 'center') {
                offset = offset - viewportHeight / 2 + targetRowHeight / 2;
            } else if (align === 'bottom') {
                offset = offset - viewportHeight + targetRowHeight;
            }
            // 'top' uses the base offset

            // Ensure offset is not negative
            offset = Math.max(0, offset);

            scrollToTableOffset(offset);
        },
        [
            calculateScrollTopForIndex,
            scrollToTableOffset,
            enableHeader,
            cellPadding,
            parsedColumns,
            data,
            enableAlternateRowColors,
            enableExpansion,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            itemType,
            playerContext,
            size,
            tableId,
            DEFAULT_ROW_HEIGHT,
            rowHeight,
        ],
    );

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

            if (enableDrag) {
                autoScrollForElements({
                    canScroll: () => true,
                    element: root.firstElementChild as HTMLElement,
                    getAllowedAxis: () => 'vertical',
                    getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
                });
            }
        }

        return undefined;
    }, [enableDrag, initialize]);

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
    }, [pinnedLeftColumnCount, pinnedRightColumnCount]);

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

    // Handle top shadow visibility based on vertical scroll
    useEffect(() => {
        const row = rowRef.current?.childNodes[0] as HTMLDivElement;

        if (!row || !enableHeader) {
            setShowTopShadow(false);
            return;
        }

        const checkScrollPosition = () => {
            const scrollTop = row.scrollTop;
            setShowTopShadow(scrollTop > 0);
        };

        checkScrollPosition();

        row.addEventListener('scroll', checkScrollPosition);

        return () => {
            row.removeEventListener('scroll', checkScrollPosition);
        };
    }, [enableHeader]);

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

    const getDataFn = useCallback(() => {
        return enableHeader ? [null, ...data] : data;
    }, [data, enableHeader]);

    const extractRowId = useMemo(() => createExtractRowId(getRowId), [getRowId]);

    const internalState = useItemListState(getDataFn, extractRowId);

    const hasExpanded = internalState.hasExpanded();

    // Helper function to get ItemListStateItemWithRequiredProperties (rowId is separate, not part of item)
    const getStateItem = useCallback(
        (item: any): ItemListStateItemWithRequiredProperties | null => {
            if (!hasRequiredItemProperties(item)) return null;
            if (
                typeof item === 'object' &&
                item !== null &&
                '_serverId' in item &&
                '_itemType' in item
            ) {
                return item as ItemListStateItemWithRequiredProperties;
            }
            return null;
        },
        [],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!enableSelection) return;
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            e.stopPropagation();

            const selected = internalState.getSelected();
            const validSelected = selected.filter(hasRequiredStateItemProperties);
            let currentIndex = -1;

            if (validSelected.length > 0) {
                const lastSelected = validSelected[validSelected.length - 1];
                currentIndex = data.findIndex(
                    (d) => hasRequiredItemProperties(d) && d.id === lastSelected.id,
                );
            }

            let newIndex = 0;
            if (currentIndex !== -1) {
                newIndex =
                    e.key === 'ArrowDown'
                        ? Math.min(currentIndex + 1, data.length - 1)
                        : Math.max(currentIndex - 1, 0);
            }

            const newItem: any = data[newIndex];
            if (!newItem) return;

            // Handle Shift + Arrow for incremental range selection (matches shift+click behavior)
            if (e.shiftKey) {
                const selectedItems = internalState.getSelected();
                const validSelectedItems = selectedItems.filter(hasRequiredStateItemProperties);
                const lastSelectedItem = validSelectedItems[validSelectedItems.length - 1];

                if (lastSelectedItem) {
                    // Find the indices of the last selected item and new item
                    const lastRowId = lastSelectedItem.rowId;
                    const lastIndex = data.findIndex((d) => {
                        const rowId = extractRowId(d);
                        return rowId === lastRowId;
                    });

                    if (lastIndex !== -1 && newIndex !== -1) {
                        // Create range selection from last selected to new position
                        const startIndex = Math.min(lastIndex, newIndex);
                        const stopIndex = Math.max(lastIndex, newIndex);

                        const rangeItems: ItemListStateItemWithRequiredProperties[] = [];
                        for (let i = startIndex; i <= stopIndex; i++) {
                            const rangeItem = data[i];
                            const stateItem = getStateItem(rangeItem);
                            if (stateItem && extractRowId(stateItem)) {
                                rangeItems.push(stateItem);
                            }
                        }

                        // Add range items to selection (matching shift+click behavior)
                        const currentSelected = internalState.getSelected();
                        const validSelected = currentSelected.filter(
                            hasRequiredStateItemProperties,
                        );
                        const newSelected: ItemListStateItemWithRequiredProperties[] = [
                            ...validSelected,
                        ];
                        rangeItems.forEach((rangeItem) => {
                            const rangeRowId = extractRowId(rangeItem);
                            if (
                                rangeRowId &&
                                !newSelected.some(
                                    (selected) => extractRowId(selected) === rangeRowId,
                                )
                            ) {
                                newSelected.push(rangeItem);
                            }
                        });

                        // Ensure the last item in selection is the item at newIndex for incremental extension
                        const newItemListItem = getStateItem(newItem);
                        if (newItemListItem && extractRowId(newItemListItem)) {
                            const newItemRowId = extractRowId(newItemListItem);
                            // Remove the new item from its current position if it exists
                            const filteredSelected = newSelected.filter(
                                (item) => extractRowId(item) !== newItemRowId,
                            );
                            // Add it at the end so it becomes the last selected item
                            filteredSelected.push(newItemListItem);
                            internalState.setSelected(filteredSelected);
                        }
                    }
                } else {
                    // No previous selection, just select the new item
                    const newItemListItem = getStateItem(newItem);
                    if (newItemListItem && extractRowId(newItemListItem)) {
                        internalState.setSelected([newItemListItem]);
                    }
                }
            } else {
                // Without Shift: select only the new item
                const newItemListItem = getStateItem(newItem);
                if (newItemListItem && extractRowId(newItemListItem)) {
                    internalState.setSelected([newItemListItem]);
                }
            }

            const offset = calculateScrollTopForIndex(newIndex);
            scrollToTableOffset(offset);
        },
        [
            data,
            enableSelection,
            internalState,
            calculateScrollTopForIndex,
            scrollToTableOffset,
            extractRowId,
            getStateItem,
        ],
    );

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

    // Scroll to top when currentPage changes
    useEffect(() => {
        if (currentPage !== undefined) {
            scrollToTableOffset(0);
        }
    }, [currentPage, scrollToTableOffset]);

    const imperativeHandle: ItemListHandle = useMemo(() => {
        return {
            internalState,
            scrollToIndex: (index: number, options?: { align?: 'bottom' | 'center' | 'top' }) => {
                scrollToTableIndex(enableHeader ? index + 1 : index, options);
            },
            scrollToOffset: (offset: number) => {
                scrollToTableOffset(offset);
            },
        };
    }, [enableHeader, internalState, scrollToTableIndex, scrollToTableOffset]);

    useImperativeHandle(ref, () => imperativeHandle);

    useEffect(() => {
        handleRef.current = imperativeHandle;
    }, [imperativeHandle]);

    const controls = useDefaultItemListControls({
        onColumnReordered,
        onColumnResized,
    });

    return (
        <div
            className={styles.itemTableListContainer}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => (e.currentTarget as HTMLDivElement).focus()}
            ref={containerFocusRef}
            tabIndex={0}
        >
            <VirtualizedTableGrid
                calculatedColumnWidths={calculatedColumnWidths}
                CellComponent={CellComponent}
                cellPadding={cellPadding}
                controls={controls}
                data={data}
                enableAlternateRowColors={enableAlternateRowColors}
                enableColumnReorder={!!onColumnReordered}
                enableColumnResize={!!onColumnResized}
                enableDrag={enableDrag}
                enableExpansion={enableExpansion}
                enableHeader={enableHeader}
                enableHorizontalBorders={enableHorizontalBorders}
                enableRowHoverHighlight={enableRowHoverHighlight}
                enableSelection={enableSelection}
                enableVerticalBorders={enableVerticalBorders}
                getRowHeight={getRowHeight}
                headerHeight={headerHeight}
                internalState={internalState}
                itemType={itemType}
                mergedRowRef={mergedRowRef}
                onRangeChanged={onRangeChanged}
                parsedColumns={parsedColumns}
                pinnedLeftColumnCount={pinnedLeftColumnCount}
                pinnedLeftColumnRef={pinnedLeftColumnRef}
                pinnedRightColumnCount={pinnedRightColumnCount}
                pinnedRightColumnRef={pinnedRightColumnRef}
                pinnedRowCount={pinnedRowCount}
                pinnedRowRef={pinnedRowRef}
                playerContext={playerContext}
                showLeftShadow={showLeftShadow}
                showRightShadow={showRightShadow}
                showTopShadow={showTopShadow}
                size={size}
                tableId={tableId}
                totalColumnCount={totalColumnCount}
                totalRowCount={totalRowCount}
            />
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
