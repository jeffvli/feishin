// Component adapted from https://github.com/bvaughn/react-window/issues/826

import clsx from 'clsx';
import { motion } from 'motion/react';
import React, {
    type JSXElementConstructor,
    memo,
    ReactElement,
    Ref,
    RefObject,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { useParams } from 'react-router';
import { type CellComponentProps, Grid } from 'react-window-v2';

import styles from './item-table-list.module.css';

import { appendLayoutFillColumn } from '/@/renderer/components/item-list/helpers/append-layout-fill-column';
import { createExtractRowId } from '/@/renderer/components/item-list/helpers/extract-row-id';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    ItemListStateItemWithRequiredProperties,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { parseTableColumns } from '/@/renderer/components/item-list/helpers/parse-table-columns';
import { useListHotkeys } from '/@/renderer/components/item-list/helpers/use-list-hotkeys';
import { useContainerWidthTracking } from '/@/renderer/components/item-list/item-table-list/hooks/use-container-width-tracking';
import { useRowInteractionDelegate } from '/@/renderer/components/item-list/item-table-list/hooks/use-row-interaction-delegate';
import { useStickyGroupRowPositioning } from '/@/renderer/components/item-list/item-table-list/hooks/use-sticky-group-row-positioning';
import { useStickyHeaderPositioning } from '/@/renderer/components/item-list/item-table-list/hooks/use-sticky-header-positioning';
import { useStickyTableGroupRows } from '/@/renderer/components/item-list/item-table-list/hooks/use-sticky-table-group-rows';
import { useStickyTableHeader } from '/@/renderer/components/item-list/item-table-list/hooks/use-sticky-table-header';
import { useTableColumnModel } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-column-model';
import { useTableImperativeHandle } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-imperative-handle';
import { useTableInitialScroll } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-initial-scroll';
import { useTableKeyboardNavigation } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-keyboard-navigation';
import { useTablePaneSync } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-pane-sync';
import { useTableRowModel } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-row-model';
import { useTableScrollToIndex } from '/@/renderer/components/item-list/item-table-list/hooks/use-table-scroll-to-index';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import {
    ItemTableListColumnResizeLiveProvider,
    type ItemTableListConfig,
    ItemTableListConfigProvider,
    ItemTableListStoreProvider,
    useItemTableListColumnResizeLiveState,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-context';
import {
    MemoizedCellRouter,
    useColumnCellComponents,
} from '/@/renderer/components/item-list/item-table-list/memoized-cell-router';
import {
    createTableScrollShadowStore,
    type TableScrollShadowStore,
} from '/@/renderer/components/item-list/item-table-list/table-scroll-shadow-store';
import {
    ItemControls,
    ItemListHandle,
    ItemTableListColumnConfig,
} from '/@/renderer/components/item-list/types';
import { PlayerContext, usePlayer } from '/@/renderer/features/player/context/player-context';
import { animationProps } from '/@/shared/components/animations/animation-props';
import { useFocusWithin } from '/@/shared/hooks/use-focus-within';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
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
        '_serverId' in item &&
        typeof (item as any)._serverId === 'string'
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
        typeof (item as any)._itemType === 'string'
    );
};

export enum TableItemSize {
    COMPACT = 40,
    DEFAULT = 64,
    LARGE = 88,
}

const ItemTableScrollShadowTop = memo(function ItemTableScrollShadowTop({
    enableHeader,
    enableScrollShadow,
    scrollShadowStore,
}: {
    enableHeader: boolean;
    enableScrollShadow: boolean;
    scrollShadowStore: TableScrollShadowStore;
}) {
    const { showTopShadow } = useSyncExternalStore(
        scrollShadowStore.subscribe,
        scrollShadowStore.getSnapshot,
    );
    if (!enableHeader || !enableScrollShadow || !showTopShadow) return null;
    return <div className={styles.itemTableTopScrollShadow} />;
});

ItemTableScrollShadowTop.displayName = 'ItemTableScrollShadowTop';

const ItemTableScrollShadowLeft = memo(function ItemTableScrollShadowLeft({
    enableScrollShadow,
    pinnedLeftColumnCount,
    scrollShadowStore,
}: {
    enableScrollShadow: boolean;
    pinnedLeftColumnCount: number;
    scrollShadowStore: TableScrollShadowStore;
}) {
    const { showLeftShadow } = useSyncExternalStore(
        scrollShadowStore.subscribe,
        scrollShadowStore.getSnapshot,
    );
    if (pinnedLeftColumnCount <= 0 || !enableScrollShadow || !showLeftShadow) return null;
    return <div className={styles.itemTableLeftScrollShadow} />;
});

ItemTableScrollShadowLeft.displayName = 'ItemTableScrollShadowLeft';

const ItemTableScrollShadowRight = memo(function ItemTableScrollShadowRight({
    enableScrollShadow,
    pinnedRightColumnCount,
    scrollShadowStore,
}: {
    enableScrollShadow: boolean;
    pinnedRightColumnCount: number;
    scrollShadowStore: TableScrollShadowStore;
}) {
    const { showRightShadow } = useSyncExternalStore(
        scrollShadowStore.subscribe,
        scrollShadowStore.getSnapshot,
    );
    if (pinnedRightColumnCount <= 0 || !enableScrollShadow || !showRightShadow) return null;
    return <div className={styles.itemTableRightScrollShadow} />;
});

ItemTableScrollShadowRight.displayName = 'ItemTableScrollShadowRight';

interface VirtualizedTableGridProps {
    calculatedColumnWidths: number[];
    CellComponent: JSXElementConstructor<CellComponentProps<TableItemProps>>;
    data: unknown[];
    dataWithGroups: (null | unknown)[];
    enableScrollShadow: boolean;
    getItem?: (index: number) => undefined | unknown;
    headerHeight: number;
    mergedRowRef: React.Ref<HTMLDivElement>;
    onRangeChanged?: ItemTableListProps['onRangeChanged'];
    parsedColumns: ReturnType<typeof parseTableColumns>;
    pinnedLeftColumnCount: number;
    pinnedLeftColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRightColumnCount: number;
    pinnedRightColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRowCount: number;
    pinnedRowRef: React.RefObject<HTMLDivElement | null>;
    scrollShadowStore: TableScrollShadowStore;
    tableConfig: ItemTableListConfig;
    totalColumnCount: number;
    totalRowCount: number;
}

const VirtualizedTableGrid = ({
    calculatedColumnWidths,
    CellComponent,
    data,
    dataWithGroups,
    enableScrollShadow,
    getItem,
    headerHeight,
    mergedRowRef,
    onRangeChanged,
    parsedColumns,
    pinnedLeftColumnCount,
    pinnedLeftColumnRef,
    pinnedRightColumnCount,
    pinnedRightColumnRef,
    pinnedRowCount,
    pinnedRowRef,
    scrollShadowStore,
    tableConfig,
    totalColumnCount,
    totalRowCount,
}: VirtualizedTableGridProps) => {
    const { enableHeader, enableRowHoverHighlight, getRowHeight, groups } = tableConfig;
    const hoverDelegateRef = useRef<HTMLDivElement | null>(null);

    useRowInteractionDelegate({
        containerRef: hoverDelegateRef,
        enableRowHoverHighlight,
    });

    const columnWidth = useCallback(
        (index: number) => calculatedColumnWidths[index],
        [calculatedColumnWidths],
    );

    const columnWidthMemoized = useCallback(
        (index: number) => columnWidth(index + pinnedLeftColumnCount),
        [columnWidth, pinnedLeftColumnCount],
    );

    const groupHeaderInfoByRowIndex = useMemo(() => {
        if (!groups || groups.length === 0) return undefined;

        const map = new Map<number, { groupIndex: number; startDataIndex: number }>();
        const headerOffset = enableHeader ? 1 : 0;
        let cumulativeDataIndex = 0;

        for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            const groupHeaderIndex = headerOffset + cumulativeDataIndex + groupIndex;
            map.set(groupHeaderIndex, { groupIndex, startDataIndex: cumulativeDataIndex });
            cumulativeDataIndex += groups[groupIndex].itemCount;
        }

        return map;
    }, [groups, enableHeader]);

    const rowHeightMemoized = useCallback(
        (index: number, cellProps: TableItemProps) => {
            const adjustedIndex = index + pinnedRowCount;
            return getRowHeight(adjustedIndex, cellProps);
        },
        [getRowHeight, pinnedRowCount],
    );

    const pinnedRightColumnWidthMemoized = useCallback(
        (index: number) => columnWidth(index + pinnedLeftColumnCount + totalColumnCount),
        [columnWidth, pinnedLeftColumnCount, totalColumnCount],
    );

    const getGroupRenderData = useCallback(() => data, [data]);

    // Calculate pinned column widths for group header positioning
    const pinnedLeftColumnWidths = useMemo(() => {
        return Array.from({ length: pinnedLeftColumnCount }, (_, i) => columnWidth(i));
    }, [pinnedLeftColumnCount, columnWidth]);

    const pinnedRightColumnWidths = useMemo(() => {
        return Array.from({ length: pinnedRightColumnCount }, (_, i) =>
            columnWidth(i + pinnedLeftColumnCount + totalColumnCount),
        );
    }, [pinnedRightColumnCount, pinnedLeftColumnCount, totalColumnCount, columnWidth]);

    const groupHeaderRowIndexes = useMemo(() => {
        if (!groupHeaderInfoByRowIndex || groupHeaderInfoByRowIndex.size === 0) return [];
        return Array.from(groupHeaderInfoByRowIndex.keys()).sort((a, b) => a - b);
    }, [groupHeaderInfoByRowIndex]);

    const adjustedRowIndexCacheRef = useRef<{ lastRowIndex: number; pos: number }>({
        lastRowIndex: -1,
        pos: 0,
    });

    useEffect(() => {
        adjustedRowIndexCacheRef.current = { lastRowIndex: -1, pos: 0 };
    }, [enableHeader, groupHeaderRowIndexes, groups]);

    const getAdjustedRowIndex = useCallback(
        (rowIndex: number) => {
            if (!groups || groups.length === 0) {
                if (enableHeader && rowIndex === 0) return 0;
                return enableHeader ? rowIndex : rowIndex + 1;
            }

            if (enableHeader && rowIndex === 0) return 0;
            if (groupHeaderInfoByRowIndex?.has(rowIndex)) return 0;

            const headerOffset = enableHeader ? 1 : 0;
            const cache = adjustedRowIndexCacheRef.current;

            // Count group header rows strictly before this rowIndex.
            let pos: number;
            if (cache.lastRowIndex !== -1 && rowIndex >= cache.lastRowIndex) {
                pos = cache.pos;
                while (
                    pos < groupHeaderRowIndexes.length &&
                    groupHeaderRowIndexes[pos] < rowIndex
                ) {
                    pos++;
                }
            } else {
                // upperBound(groupHeaderRowIndexes, rowIndex - 1)
                let lo = 0;
                let hi = groupHeaderRowIndexes.length;
                const target = rowIndex - 1;
                while (lo < hi) {
                    const mid = (lo + hi) >>> 1;
                    if (groupHeaderRowIndexes[mid] <= target) lo = mid + 1;
                    else hi = mid;
                }
                pos = lo;
            }

            cache.lastRowIndex = rowIndex;
            cache.pos = pos;

            const groupHeadersBefore = pos;
            const dataIndexZeroBased = rowIndex - headerOffset - groupHeadersBefore;
            return dataIndexZeroBased + 1;
        },
        [enableHeader, groupHeaderInfoByRowIndex, groupHeaderRowIndexes, groups],
    );

    const getRowItem = useCallback(
        (rowIndex: number): null | undefined | unknown => {
            // Header row
            if (enableHeader && rowIndex === 0) return null;
            // Group header rows are represented as null in the row model
            if (groupHeaderInfoByRowIndex?.has(rowIndex)) return null;

            if (!groups || groups.length === 0) {
                const dataIndex = enableHeader ? rowIndex - 1 : rowIndex;
                return getItem ? getItem(dataIndex) : dataWithGroups[rowIndex];
            }

            const headerOffset = enableHeader ? 1 : 0;

            // Count group header rows strictly before this rowIndex (upperBound on groupHeaderRowIndexes)
            let lo = 0;
            let hi = groupHeaderRowIndexes.length;
            const target = rowIndex - 1;
            while (lo < hi) {
                const mid = (lo + hi) >>> 1;
                if (groupHeaderRowIndexes[mid] <= target) lo = mid + 1;
                else hi = mid;
            }
            const groupHeadersBefore = lo;

            const dataIndex = rowIndex - headerOffset - groupHeadersBefore;
            return getItem ? getItem(dataIndex) : undefined;
        },
        [
            dataWithGroups,
            enableHeader,
            getItem,
            groupHeaderInfoByRowIndex,
            groupHeaderRowIndexes,
            groups,
        ],
    );

    const gridOnlyProps = useMemo(
        () => ({
            calculatedColumnWidths,
            data: dataWithGroups,
            getAdjustedRowIndex,
            getGroupRenderData,
            getRowItem,
            groupHeaderInfoByRowIndex,
            hasAlbumGroupColumn: parsedColumns.some((col) => col.id === TableColumn.ALBUM_GROUP),
            pinnedLeftColumnCount,
            pinnedLeftColumnWidths,
            pinnedRightColumnCount,
            pinnedRightColumnWidths,
        }),
        [
            calculatedColumnWidths,
            dataWithGroups,
            getRowItem,
            getAdjustedRowIndex,
            getGroupRenderData,
            groupHeaderInfoByRowIndex,
            parsedColumns,
            pinnedLeftColumnCount,
            pinnedLeftColumnWidths,
            pinnedRightColumnCount,
            pinnedRightColumnWidths,
        ],
    );

    const itemProps: TableItemProps = useMemo(
        () => ({
            cellPadding: tableConfig.cellPadding,
            columns: tableConfig.columns,
            controls: tableConfig.controls,
            enableAlternateRowColors: tableConfig.enableAlternateRowColors,
            enableColumnReorder: tableConfig.enableColumnReorder,
            enableColumnResize: tableConfig.enableColumnResize,
            enableDrag: tableConfig.enableDrag,
            enableExpansion: tableConfig.enableExpansion,
            enableHeader: tableConfig.enableHeader,
            enableHorizontalBorders: tableConfig.enableHorizontalBorders,
            enableRowHoverHighlight: tableConfig.enableRowHoverHighlight,
            enableSelection: tableConfig.enableSelection,
            enableVerticalBorders: tableConfig.enableVerticalBorders,
            getRowHeight: tableConfig.getRowHeight,
            groups: tableConfig.groups,
            internalState: tableConfig.internalState,
            itemType: tableConfig.itemType,
            playerContext: tableConfig.playerContext,
            playlistId: tableConfig.playlistId,
            size: tableConfig.size,
            startRowIndex: tableConfig.startRowIndex,
            tableId: tableConfig.tableId,
            ...gridOnlyProps,
        }),
        [gridOnlyProps, tableConfig],
    );

    const pinnedLeftGridMinWidthPx = useMemo(() => {
        let sum = 0;
        for (let i = 0; i < pinnedLeftColumnCount; i++) {
            sum += calculatedColumnWidths[i] ?? 0;
        }
        return sum;
    }, [calculatedColumnWidths, pinnedLeftColumnCount]);

    const pinnedRightGridMinWidthPx = useMemo(() => {
        let sum = 0;
        const start = pinnedLeftColumnCount + totalColumnCount;
        for (let i = 0; i < pinnedRightColumnCount; i++) {
            sum += calculatedColumnWidths[start + i] ?? 0;
        }
        return sum;
    }, [calculatedColumnWidths, pinnedLeftColumnCount, pinnedRightColumnCount, totalColumnCount]);

    const pinnedRowsMinHeightPx = useMemo(() => {
        let sum = 0;
        for (let i = 0; i < pinnedRowCount; i++) {
            sum += getRowHeight(i, itemProps);
        }
        return sum;
    }, [getRowHeight, itemProps, pinnedRowCount]);

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
        <div className={styles.itemTableContainer} ref={hoverDelegateRef}>
            <div
                className={styles.itemTablePinnedColumnsGridContainer}
                style={
                    {
                        '--header-height': `${headerHeight}px`,
                        minWidth: `${pinnedLeftGridMinWidthPx}px`,
                    } as React.CSSProperties
                }
            >
                {!!(pinnedLeftColumnCount || pinnedRowCount) && (
                    <div
                        className={clsx(styles.itemTablePinnedIntersectionGridContainer, {
                            [styles.withHeader]: enableHeader,
                        })}
                        style={{
                            minHeight: `${pinnedRowsMinHeightPx}px`,
                            overflow: 'visible',
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
                <ItemTableScrollShadowTop
                    enableHeader={!!enableHeader}
                    enableScrollShadow={enableScrollShadow}
                    scrollShadowStore={scrollShadowStore}
                />
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
                                minHeight: `${pinnedRowsMinHeightPx}px`,
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
                            rowCount={pinnedRowCount}
                            rowHeight={getRowHeight}
                        />
                    </div>
                )}
                <ItemTableScrollShadowTop
                    enableHeader={!!enableHeader}
                    enableScrollShadow={enableScrollShadow}
                    scrollShadowStore={scrollShadowStore}
                />
                <div className={styles.itemTableGridContainer} ref={mergedRowRef}>
                    <Grid
                        cellComponent={RowCell}
                        cellProps={itemProps}
                        className={styles.height100}
                        columnCount={totalColumnCount}
                        columnWidth={columnWidthMemoized}
                        onCellsRendered={handleOnCellsRendered}
                        rowCount={totalRowCount}
                        rowHeight={rowHeightMemoized}
                    />
                    <ItemTableScrollShadowLeft
                        enableScrollShadow={enableScrollShadow}
                        pinnedLeftColumnCount={pinnedLeftColumnCount}
                        scrollShadowStore={scrollShadowStore}
                    />
                    <ItemTableScrollShadowRight
                        enableScrollShadow={enableScrollShadow}
                        pinnedRightColumnCount={pinnedRightColumnCount}
                        scrollShadowStore={scrollShadowStore}
                    />
                </div>
            </div>
            {!!pinnedRightColumnCount && (
                <div
                    className={styles.itemTablePinnedColumnsGridContainer}
                    style={
                        {
                            '--header-height': `${headerHeight}px`,
                            minWidth: `${pinnedRightGridMinWidthPx}px`,
                        } as React.CSSProperties
                    }
                >
                    {!!(pinnedRightColumnCount || pinnedRowCount) && (
                        <div
                            className={clsx(styles.itemTablePinnedIntersectionGridContainer, {
                                [styles.withHeader]: enableHeader,
                            })}
                            style={{
                                minHeight: `${pinnedRowsMinHeightPx}px`,
                                overflow: 'visible',
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
                    <ItemTableScrollShadowTop
                        enableHeader={!!enableHeader}
                        enableScrollShadow={enableScrollShadow}
                        scrollShadowStore={scrollShadowStore}
                    />
                    <div
                        className={styles.itemTablePinnedRightColumnsContainer}
                        ref={pinnedRightColumnRef}
                    >
                        <Grid
                            cellComponent={PinnedRightColumnCell}
                            cellProps={itemProps}
                            className={clsx(styles.noScrollbar, styles.height100)}
                            columnCount={pinnedRightColumnCount}
                            columnWidth={pinnedRightColumnWidthMemoized}
                            rowCount={totalRowCount}
                            rowHeight={rowHeightMemoized}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

VirtualizedTableGrid.displayName = 'VirtualizedTableGrid';

function shallowEqualNumberArrays(a: number[], b: number[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const MemoizedVirtualizedTableGrid = memo(VirtualizedTableGrid, (prevProps, nextProps) => {
    return (
        shallowEqualNumberArrays(
            prevProps.calculatedColumnWidths,
            nextProps.calculatedColumnWidths,
        ) &&
        prevProps.tableConfig === nextProps.tableConfig &&
        prevProps.data === nextProps.data &&
        prevProps.dataWithGroups === nextProps.dataWithGroups &&
        prevProps.enableScrollShadow === nextProps.enableScrollShadow &&
        prevProps.getItem === nextProps.getItem &&
        prevProps.headerHeight === nextProps.headerHeight &&
        prevProps.mergedRowRef === nextProps.mergedRowRef &&
        prevProps.onRangeChanged === nextProps.onRangeChanged &&
        prevProps.parsedColumns === nextProps.parsedColumns &&
        prevProps.pinnedLeftColumnCount === nextProps.pinnedLeftColumnCount &&
        prevProps.pinnedLeftColumnRef === nextProps.pinnedLeftColumnRef &&
        prevProps.pinnedRightColumnCount === nextProps.pinnedRightColumnCount &&
        prevProps.pinnedRightColumnRef === nextProps.pinnedRightColumnRef &&
        prevProps.pinnedRowCount === nextProps.pinnedRowCount &&
        prevProps.pinnedRowRef === nextProps.pinnedRowRef &&
        prevProps.scrollShadowStore === nextProps.scrollShadowStore &&
        prevProps.totalColumnCount === nextProps.totalColumnCount &&
        prevProps.totalRowCount === nextProps.totalRowCount &&
        prevProps.CellComponent === nextProps.CellComponent
    );
});

MemoizedVirtualizedTableGrid.displayName = 'MemoizedVirtualizedTableGrid';

export interface TableGroupHeader {
    itemCount: number;
    render: (props: {
        data: unknown[];
        groupIndex: number;
        index: number;
        internalState: ItemListStateActions;
        startDataIndex: number;
    }) => ReactElement;
}

export interface TableItemProps {
    adjustedRowIndexMap?: Map<number, number>;
    calculatedColumnWidths?: number[];
    cellPadding?: ItemTableListProps['cellPadding'];
    columns: ItemTableListColumnConfig[];
    controls: ItemControls;
    data: ItemTableListProps['data'];
    enableAlternateRowColors?: ItemTableListProps['enableAlternateRowColors'];
    enableColumnReorder?: boolean;
    enableColumnResize?: boolean;
    enableDrag?: ItemTableListProps['enableDrag'];
    enableDragScroll?: boolean;
    enableExpansion?: ItemTableListProps['enableExpansion'];
    enableHeader?: ItemTableListProps['enableHeader'];
    enableHorizontalBorders?: ItemTableListProps['enableHorizontalBorders'];
    enableRowHoverHighlight?: ItemTableListProps['enableRowHoverHighlight'];
    enableSelection?: ItemTableListProps['enableSelection'];
    enableVerticalBorders?: ItemTableListProps['enableVerticalBorders'];
    getAdjustedRowIndex?: (rowIndex: number) => number;
    getGroupRenderData?: () => unknown[];
    getRowHeight: (index: number, cellProps: TableItemProps) => number;
    getRowItem?: (rowIndex: number) => null | undefined | unknown;
    groupHeaderInfoByRowIndex?: Map<number, { groupIndex: number; startDataIndex: number }>;
    groups?: TableGroupHeader[];
    hasAlbumGroupColumn?: boolean;
    internalState: ItemListStateActions;
    itemType: ItemTableListProps['itemType'];
    onRowClick?: (item: any, event: React.MouseEvent<HTMLDivElement>) => void;
    pinnedLeftColumnCount?: number;
    pinnedLeftColumnWidths?: number[];
    pinnedRightColumnCount?: number;
    pinnedRightColumnWidths?: number[];
    playerContext: PlayerContext;
    playlistId?: string;
    size?: ItemTableListProps['size'];
    startRowIndex?: number;
    tableId: string;
}

interface ItemTableListProps {
    activeRowId?: string;
    autoFitColumns?: boolean;
    CellComponent?: JSXElementConstructor<CellComponentProps<TableItemProps>>;
    cellPadding?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    columns: ItemTableListColumnConfig[];
    data: unknown[];
    enableAlternateRowColors?: boolean;
    enableDrag?: boolean;
    enableDragScroll?: boolean;
    enableEntranceAnimation?: boolean;
    enableExpansion?: boolean;
    enableHeader?: boolean;
    enableHorizontalBorders?: boolean;
    enableRowHoverHighlight?: boolean;
    enableScrollShadow?: boolean;
    enableSelection?: boolean;
    enableSelectionDialog?: boolean;
    enableStickyGroupRows?: boolean;
    enableStickyHeader?: boolean;
    enableVerticalBorders?: boolean;
    getItem?: (index: number) => undefined | unknown;
    getItemIndex?: (rowId: string) => number | undefined;
    getRowId?: ((item: unknown) => string) | string;
    groups?: TableGroupHeader[];
    headerHeight?: number;
    initialTop?: {
        behavior?: 'auto' | 'smooth';
        to: number;
        type: 'index' | 'offset';
    };
    itemCount?: number;
    itemType: LibraryItem;
    onColumnReordered?: (
        columnIdFrom: TableColumn,
        columnIdTo: TableColumn,
        edge: 'bottom' | 'left' | 'right' | 'top' | null,
    ) => void;
    onColumnResized?: (columnId: TableColumn, width: number) => void;
    onRangeChanged?: (range: { startIndex: number; stopIndex: number }) => void;
    onScrollEnd?: (offset: number, internalState: ItemListStateActions) => void;
    overrideControls?: Partial<ItemControls>;
    ref?: Ref<ItemListHandle>;
    rowHeight?: ((index: number, cellProps: TableItemProps) => number) | number;
    size?: 'compact' | 'default' | 'large';
    startRowIndex?: number;
}

const ItemTableListStickyUI = memo(
    ({
        calculatedColumnWidths,
        CellComponent,
        containerRef,
        data,
        enableHeader,
        enableStickyGroupRows,
        enableStickyHeader,
        getRowHeightWrapper,
        groups,
        headerHeight,
        internalState,
        parsedColumns,
        pinnedLeftColumnCount,
        pinnedLeftColumnRef,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        pinnedRowRef,
        rowHeight,
        rowRef,
        size,
        stickyHeaderItemProps,
        totalColumnCount,
    }: {
        calculatedColumnWidths: number[];
        CellComponent: JSXElementConstructor<CellComponentProps<TableItemProps>>;
        containerRef: RefObject<HTMLDivElement | null>;
        data: unknown[];
        enableHeader: boolean;
        enableStickyGroupRows: boolean;
        enableStickyHeader: boolean;
        getRowHeightWrapper: (index: number) => number;
        groups?: TableGroupHeader[];
        headerHeight: number;
        internalState: ItemListStateActions;
        parsedColumns: ReturnType<typeof parseTableColumns>;
        pinnedLeftColumnCount: number;
        pinnedLeftColumnRef: RefObject<HTMLDivElement | null>;
        pinnedRightColumnCount: number;
        pinnedRightColumnRef: RefObject<HTMLDivElement | null>;
        pinnedRowRef: RefObject<HTMLDivElement | null>;
        rowHeight?: ((index: number, cellProps: TableItemProps) => number) | number;
        rowRef: RefObject<HTMLDivElement | null>;
        size: 'compact' | 'default' | 'large';
        stickyHeaderItemProps: TableItemProps;
        totalColumnCount: number;
    }) => {
        const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
        const stickyGroupRowRef = useRef<HTMLDivElement | null>(null);
        const stickyHeaderLeftRef = useRef<HTMLDivElement | null>(null);
        const stickyHeaderMainRef = useRef<HTMLDivElement | null>(null);
        const stickyHeaderRightRef = useRef<HTMLDivElement | null>(null);

        const { shouldShowStickyHeader, stickyTop } = useStickyTableHeader({
            containerRef,
            enabled: enableHeader && enableStickyHeader,
            headerRef: pinnedRowRef,
            mainGridRef: rowRef,
            pinnedLeftColumnRef,
            pinnedRightColumnRef,
            stickyHeaderMainRef,
        });

        useStickyHeaderPositioning({
            containerRef,
            shouldShowStickyHeader,
            stickyHeaderRef,
        });

        const {
            shouldShowStickyGroupRow,
            stickyGroupIndex,
            stickyTop: stickyGroupTop,
        } = useStickyTableGroupRows({
            containerRef,
            enabled: enableStickyGroupRows && !!groups && groups.length > 0,
            getRowHeight: getRowHeightWrapper,
            groups,
            headerHeight,
            mainGridRef: rowRef,
            shouldShowStickyHeader,
            stickyHeaderTop: stickyTop,
        });

        const shouldRenderStickyGroupRow = shouldShowStickyGroupRow;

        useStickyGroupRowPositioning({
            containerRef,
            shouldRenderStickyGroupRow,
            stickyGroupRowRef,
        });

        const StickyHeader = useMemo(() => {
            if (!shouldShowStickyHeader || !enableHeader) {
                return null;
            }

            const pinnedLeftWidth = calculatedColumnWidths
                .slice(0, pinnedLeftColumnCount)
                .reduce((sum, width) => sum + width, 0);
            const mainWidth = calculatedColumnWidths
                .slice(pinnedLeftColumnCount, pinnedLeftColumnCount + totalColumnCount)
                .reduce((sum, width) => sum + width, 0);
            const pinnedRightWidth = calculatedColumnWidths
                .slice(pinnedLeftColumnCount + totalColumnCount)
                .reduce((sum, width) => sum + width, 0);

            return (
                <div
                    className={styles.stickyHeader}
                    ref={stickyHeaderRef}
                    style={{
                        top: `${stickyTop}px`,
                    }}
                >
                    <div className={styles.stickyHeaderRow}>
                        {pinnedLeftColumnCount > 0 && (
                            <div
                                className={clsx(
                                    styles.stickyHeaderSection,
                                    styles.stickyHeaderPinnedLeft,
                                )}
                                ref={stickyHeaderLeftRef}
                                style={{
                                    flex: '0 1 auto',
                                    minWidth: `${pinnedLeftWidth}px`,
                                    overflow: 'visible',
                                }}
                            >
                                {parsedColumns
                                    .filter((col) => col.pinned === 'left')
                                    .map((col) => {
                                        const columnIndex = parsedColumns.findIndex(
                                            (c) => c === col,
                                        );
                                        return (
                                            <CellComponent
                                                ariaAttributes={{
                                                    'aria-colindex': columnIndex + 1,
                                                    role: 'gridcell',
                                                }}
                                                columnIndex={columnIndex}
                                                key={col.id}
                                                rowIndex={0}
                                                style={{
                                                    height: headerHeight,
                                                    width: calculatedColumnWidths[columnIndex],
                                                }}
                                                {...stickyHeaderItemProps}
                                            />
                                        );
                                    })}
                            </div>
                        )}
                        <div
                            className={clsx(
                                styles.stickyHeaderSection,
                                styles.stickyHeaderMain,
                                styles.noScrollbar,
                            )}
                            ref={stickyHeaderMainRef}
                            style={{
                                flex: '1 1 auto',
                                minWidth: 0,
                                overflowX: 'auto',
                                overflowY: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    minWidth: `${mainWidth}px`,
                                }}
                            >
                                {parsedColumns
                                    .filter((col) => col.pinned === null)
                                    .map((col) => {
                                        const columnIndex = parsedColumns.findIndex(
                                            (c) => c === col,
                                        );
                                        return (
                                            <CellComponent
                                                ariaAttributes={{
                                                    'aria-colindex': columnIndex + 1,
                                                    role: 'gridcell',
                                                }}
                                                columnIndex={columnIndex}
                                                key={col.id}
                                                rowIndex={0}
                                                style={{
                                                    flexShrink: 0,
                                                    height: headerHeight,
                                                    width: calculatedColumnWidths[columnIndex],
                                                }}
                                                {...stickyHeaderItemProps}
                                            />
                                        );
                                    })}
                            </div>
                        </div>
                        {pinnedRightColumnCount > 0 && (
                            <div
                                className={clsx(
                                    styles.stickyHeaderSection,
                                    styles.stickyHeaderPinnedRight,
                                )}
                                ref={stickyHeaderRightRef}
                                style={{
                                    flex: '0 1 auto',
                                    minWidth: `${pinnedRightWidth}px`,
                                    overflow: 'visible',
                                }}
                            >
                                {parsedColumns
                                    .filter((col) => col.pinned === 'right')
                                    .map((col) => {
                                        const columnIndex = parsedColumns.findIndex(
                                            (c) => c === col,
                                        );
                                        return (
                                            <CellComponent
                                                ariaAttributes={{
                                                    'aria-colindex': columnIndex + 1,
                                                    role: 'gridcell',
                                                }}
                                                columnIndex={columnIndex}
                                                key={col.id}
                                                rowIndex={0}
                                                style={{
                                                    height: headerHeight,
                                                    width: calculatedColumnWidths[columnIndex],
                                                }}
                                                {...stickyHeaderItemProps}
                                            />
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }, [
            shouldShowStickyHeader,
            enableHeader,
            stickyTop,
            calculatedColumnWidths,
            pinnedLeftColumnCount,
            pinnedRightColumnCount,
            totalColumnCount,
            parsedColumns,
            headerHeight,
            CellComponent,
            stickyHeaderItemProps,
        ]);

        const groupRowHeight = useMemo(() => {
            if (stickyGroupIndex === null || !groups) {
                const height = size === 'compact' ? 40 : size === 'large' ? 88 : 64;
                return typeof rowHeight === 'number' ? rowHeight : height;
            }

            let cumulativeDataIndex = 0;
            const headerOffset = enableHeader ? 1 : 0;
            for (let i = 0; i < stickyGroupIndex; i++) {
                cumulativeDataIndex += groups[i].itemCount;
            }
            const groupHeaderIndex = headerOffset + cumulativeDataIndex + stickyGroupIndex;

            return getRowHeightWrapper(groupHeaderIndex);
        }, [stickyGroupIndex, groups, getRowHeightWrapper, enableHeader, rowHeight, size]);

        const StickyGroupRow = useMemo(() => {
            if (!shouldRenderStickyGroupRow || stickyGroupIndex === null || !groups) {
                return null;
            }

            const group = groups[stickyGroupIndex];
            const originalData = data.filter((item) => item !== null);
            let cumulativeDataIndex = 0;
            for (let i = 0; i < stickyGroupIndex; i++) {
                cumulativeDataIndex += groups[i].itemCount;
            }

            const groupContent = group.render({
                data: originalData,
                groupIndex: stickyGroupIndex,
                index: 0,
                internalState,
                startDataIndex: cumulativeDataIndex,
            });

            const pinnedLeftWidth = calculatedColumnWidths
                .slice(0, pinnedLeftColumnCount)
                .reduce((sum, width) => sum + width, 0);
            const mainWidth = calculatedColumnWidths
                .slice(pinnedLeftColumnCount, pinnedLeftColumnCount + totalColumnCount)
                .reduce((sum, width) => sum + width, 0);
            const pinnedRightWidth = calculatedColumnWidths
                .slice(pinnedLeftColumnCount + totalColumnCount)
                .reduce((sum, width) => sum + width, 0);

            const totalTableWidth = calculatedColumnWidths.reduce((sum, width) => sum + width, 0);
            const actualStickyTop = stickyGroupTop;

            return (
                <div
                    className={styles.stickyGroupRow}
                    ref={stickyGroupRowRef}
                    style={{
                        top: `${actualStickyTop}px`,
                    }}
                >
                    <div className={styles.stickyGroupRowContent}>
                        {pinnedLeftColumnCount > 0 && (
                            <div
                                className={styles.stickyGroupRowSection}
                                style={{ width: `${pinnedLeftWidth}px` }}
                            >
                                <div
                                    style={{
                                        height: groupRowHeight,
                                        width: `${pinnedLeftWidth}px`,
                                    }}
                                >
                                    {groupContent}
                                </div>
                            </div>
                        )}
                        <div
                            className={styles.stickyGroupRowSection}
                            style={{
                                marginLeft: pinnedLeftColumnCount > 0 ? 0 : '-2rem',
                                marginRight: '-2rem',
                                paddingLeft: pinnedLeftColumnCount > 0 ? 0 : '2rem',
                                paddingRight: '2rem',
                                width: `${mainWidth}px`,
                            }}
                        >
                            <div
                                style={{
                                    height: groupRowHeight,
                                    marginLeft: pinnedLeftWidth > 0 ? `-${pinnedLeftWidth}px` : 0,
                                    width: `${totalTableWidth}px`,
                                }}
                            >
                                {groupContent}
                            </div>
                        </div>
                        {pinnedRightColumnCount > 0 && (
                            <div
                                className={styles.stickyGroupRowSection}
                                style={{ width: `${pinnedRightWidth}px` }}
                            >
                                <div
                                    style={{
                                        height: groupRowHeight,
                                        width: `${pinnedRightWidth}px`,
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            );
        }, [
            shouldRenderStickyGroupRow,
            stickyGroupIndex,
            groups,
            data,
            internalState,
            calculatedColumnWidths,
            pinnedLeftColumnCount,
            pinnedRightColumnCount,
            totalColumnCount,
            groupRowHeight,
            stickyGroupTop,
        ]);

        return (
            <>
                {StickyHeader}
                {StickyGroupRow}
            </>
        );
    },
);

ItemTableListStickyUI.displayName = 'ItemTableListStickyUI';

const BaseItemTableList = ({
    activeRowId,
    autoFitColumns = false,
    CellComponent = ItemTableListColumn,
    cellPadding = 'sm',
    columns,
    data,
    enableAlternateRowColors = false,
    enableDrag = true,
    enableDragScroll = true,
    enableEntranceAnimation = true,
    enableExpansion = true,
    enableHeader = true,
    enableHorizontalBorders = false,
    enableRowHoverHighlight = true,
    enableScrollShadow = true,
    enableSelection = true,
    enableStickyGroupRows = false,
    enableStickyHeader = false,
    enableVerticalBorders = false,
    getItem,
    getItemIndex,
    getRowId,
    groups,
    headerHeight = 40,
    initialTop,
    itemCount,
    itemType,
    onColumnReordered,
    onColumnResized,
    onRangeChanged,
    onScrollEnd,
    overrideControls,
    ref,
    rowHeight,
    size = 'default',
    startRowIndex,
}: ItemTableListProps) => {
    const { playlistId: routePlaylistId } = useParams() as { playlistId?: string };
    const tableId = useId();
    const baseItemCount = itemCount ?? data.length;
    const totalItemCount = enableHeader ? baseItemCount + 1 : baseItemCount;
    const [centerContainerWidth, setCenterContainerWidth] = useState(0);
    const [totalContainerWidth, setTotalContainerWidth] = useState(0);

    const columnsForLayout = useMemo(
        () => appendLayoutFillColumn(columns, autoFitColumns),
        [autoFitColumns, columns],
    );

    const {
        calculatedColumnWidths,
        parsedColumns,
        pinnedLeftColumnCount,
        pinnedRightColumnCount,
        totalColumnCount,
    } = useTableColumnModel({
        autoFitColumns,
        centerContainerWidth,
        columns: columnsForLayout,
        totalContainerWidth,
    });

    const { clearColumnResizePreview, columnResizePreview, scheduleColumnResizePreview } =
        useItemTableListColumnResizeLiveState();

    const columnResizeLiveValue = useMemo(
        () => ({
            clearColumnResizePreview,
            scheduleColumnResizePreview,
        }),
        [clearColumnResizePreview, scheduleColumnResizePreview],
    );

    const displayColumnWidths = useMemo(() => {
        if (!columnResizePreview) {
            return calculatedColumnWidths;
        }
        const next = calculatedColumnWidths.slice();
        const { columnIndex, width } = columnResizePreview;
        if (columnIndex >= 0 && columnIndex < next.length) {
            next[columnIndex] = width;
        }
        return next;
    }, [calculatedColumnWidths, columnResizePreview]);

    const playerContext = usePlayer();

    const {
        dataWithGroups: dataWithGroupsFromModel,
        groupHeaderRowCount: groupHeaderRowCountFromModel,
    } = useTableRowModel({
        data,
        enableHeader,
        groups,
    });

    const shouldUseAccessor = typeof getItem === 'function' && typeof itemCount === 'number';

    // Avoid constructing a massive row-model array for infinite lists.
    // Cell renderers use `getRowItem` accessor when provided.
    const dataWithGroups = useMemo<(null | unknown)[]>(() => {
        if (!shouldUseAccessor) return dataWithGroupsFromModel;
        return enableHeader ? [null] : [];
    }, [dataWithGroupsFromModel, enableHeader, shouldUseAccessor]);

    const groupHeaderRowCount = useMemo(() => {
        if (!shouldUseAccessor) return groupHeaderRowCountFromModel;
        return groups?.length ? groups.length : 0;
    }, [groupHeaderRowCountFromModel, groups, shouldUseAccessor]);

    const pinnedRowCount = enableHeader ? 1 : 0;

    // Group headers are inserted at specific indexes, so they add to the total row count
    const totalRowCount = totalItemCount - pinnedRowCount + groupHeaderRowCount;
    const pinnedRowRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const pinnedLeftColumnRef = useRef<HTMLDivElement>(null);
    const pinnedRightColumnRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const mergedRowRef = useMergedRef(rowRef, scrollContainerRef);
    const scrollShadowStore = useMemo(() => createTableScrollShadowStore(), []);
    const handleRef = useRef<ItemListHandle | null>(null);
    const { focused, ref: focusRef } = useFocusWithin();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mergedContainerRef = useMergedRef(containerRef, focusRef);

    useContainerWidthTracking({
        autoFitColumns,
        containerRef,
        rowRef,
        setCenterContainerWidth,
        setTotalContainerWidth,
    });

    const onScrollEndRef = useRef<ItemTableListProps['onScrollEnd']>(onScrollEnd);
    useEffect(() => {
        onScrollEndRef.current = onScrollEnd;
    }, [onScrollEnd]);

    const {
        calculateScrollTopForIndex,
        DEFAULT_ROW_HEIGHT,
        scrollToTableIndex,
        scrollToTableOffset,
    } = useTableScrollToIndex({
        cellPadding,
        columns: parsedColumns,
        data,
        enableAlternateRowColors,
        enableExpansion,
        enableHeader,
        enableHorizontalBorders,
        enableRowHoverHighlight,
        enableSelection,
        enableVerticalBorders,
        itemType,
        pinnedLeftColumnRef,
        pinnedRightColumnRef,
        playerContext,
        rowHeight,
        rowRef,
        size,
        tableId,
    });

    useTablePaneSync({
        enableDrag,
        enableDragScroll,
        enableHeader,
        handleRef,
        onScrollEndRef,
        pinnedLeftColumnCount,
        pinnedLeftColumnRef,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        pinnedRowRef,
        rowRef,
        scrollContainerRef,
        scrollShadowStore,
    });

    const getRowHeight = useCallback(
        (index: number, cellProps: TableItemProps) => {
            const height =
                size === 'compact'
                    ? TableItemSize.COMPACT
                    : size === 'large'
                      ? TableItemSize.LARGE
                      : TableItemSize.DEFAULT;

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

    // Create a wrapper for getRowHeight that doesn't require cellProps (for sticky group rows hook)
    const getRowHeightWrapper = useCallback(
        (index: number) => {
            const height =
                size === 'compact'
                    ? TableItemSize.COMPACT
                    : size === 'large'
                      ? TableItemSize.LARGE
                      : TableItemSize.DEFAULT;

            const baseHeight = typeof rowHeight === 'number' ? rowHeight : height;

            // If enableHeader is true and this is the first sticky row, use fixed header height
            if (enableHeader && index === 0 && pinnedRowCount > 0) {
                return headerHeight;
            }

            return baseHeight;
        },
        [enableHeader, headerHeight, rowHeight, pinnedRowCount, size],
    );

    const getDataFn = useCallback(() => {
        return data;
    }, [data]);

    const extractRowId = useMemo(() => createExtractRowId(getRowId), [getRowId]);

    const internalState = useItemListState(getDataFn, extractRowId);

    const getStateItem = useCallback(
        (item: any): ItemListStateItemWithRequiredProperties | null => {
            if (!hasRequiredItemProperties(item)) {
                return null;
            }
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

    const { handleKeyDown } = useTableKeyboardNavigation({
        calculateScrollTopForIndex,
        cellPadding,
        data,
        DEFAULT_ROW_HEIGHT,
        enableHeader,
        enableSelection,
        extractRowId,
        getItem,
        getItemIndex,
        getStateItem,
        hasRequiredStateItemProperties,
        internalState,
        itemCount: baseItemCount,
        itemType,
        parsedColumns,
        pinnedRightColumnCount,
        pinnedRightColumnRef,
        playerContext,
        rowHeight,
        rowRef,
        scrollToTableIndex,
        size,
        tableId,
    });

    useTableInitialScroll({
        initialTop,
        scrollToTableIndex,
        scrollToTableOffset,
        startRowIndex,
    });

    useTableImperativeHandle({
        enableHeader,
        handleRef,
        internalState,
        ref,
        scrollToTableIndex,
        scrollToTableOffset,
    });

    const controls = useDefaultItemListControls({
        onColumnReordered,
        onColumnResized,
        overrides: overrideControls,
    });

    // Create itemProps for sticky header
    const stickyHeaderItemProps: TableItemProps = useMemo(
        () => ({
            calculatedColumnWidths: displayColumnWidths,
            cellPadding,
            columns: parsedColumns,
            controls,
            data: [null], // Header row
            enableAlternateRowColors,
            enableColumnReorder: !!onColumnReordered,
            enableColumnResize: !!onColumnResized,
            enableDrag,
            enableExpansion,
            enableHeader,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            getRowHeight,
            groups,
            internalState,
            itemType,
            pinnedLeftColumnCount,
            pinnedLeftColumnWidths: displayColumnWidths.slice(0, pinnedLeftColumnCount),
            pinnedRightColumnCount,
            pinnedRightColumnWidths: displayColumnWidths.slice(
                pinnedLeftColumnCount + totalColumnCount,
            ),
            playerContext,
            playlistId: routePlaylistId,
            size,
            tableId,
        }),
        [
            displayColumnWidths,
            cellPadding,
            controls,
            parsedColumns,
            enableAlternateRowColors,
            enableDrag,
            enableExpansion,
            enableHeader,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            getRowHeight,
            groups,
            internalState,
            itemType,
            onColumnReordered,
            onColumnResized,
            pinnedLeftColumnCount,
            pinnedRightColumnCount,
            playerContext,
            routePlaylistId,
            size,
            tableId,
            totalColumnCount,
        ],
    );

    useListHotkeys({
        controls,
        focused,
        internalState,
        itemType,
    });

    const tableConfigValue = useMemo<ItemTableListConfig>(
        () => ({
            cellPadding,
            columns: parsedColumns,
            controls,
            enableAlternateRowColors,
            enableColumnReorder: !!onColumnReordered,
            enableColumnResize: !!onColumnResized,
            enableDrag,
            enableExpansion,
            enableHeader,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            getRowHeight,
            groups,
            internalState,
            itemType,
            playerContext,
            playlistId: routePlaylistId,
            size,
            startRowIndex,
            tableId,
        }),
        [
            cellPadding,
            parsedColumns,
            controls,
            enableAlternateRowColors,
            onColumnReordered,
            onColumnResized,
            enableDrag,
            enableExpansion,
            enableHeader,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            getRowHeight,
            groups,
            internalState,
            itemType,
            playerContext,
            routePlaylistId,
            size,
            startRowIndex,
            tableId,
        ],
    );

    const columnCellComponents = useColumnCellComponents(
        parsedColumns.map((c) => c.id as TableColumn),
        itemType,
    );

    const optimizedCellComponent = useMemo<
        JSXElementConstructor<CellComponentProps<TableItemProps>>
    >(() => {
        if (CellComponent && CellComponent !== ItemTableListColumn) {
            return CellComponent;
        }

        return (cellProps: CellComponentProps<TableItemProps>) => {
            return (
                <MemoizedCellRouter {...cellProps} columnCellComponents={columnCellComponents} />
            );
        };
    }, [CellComponent, columnCellComponents]);

    const tableMotion = (
        <motion.div
            className={styles.itemTableListContainer}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => {
                const element = e.currentTarget as HTMLDivElement;
                // Focus without scrolling into view
                if (element.focus) {
                    element.focus({ preventScroll: true });
                }
            }}
            ref={mergedContainerRef}
            tabIndex={0}
            {...animationProps.fadeIn}
            transition={{ duration: enableEntranceAnimation ? 0.3 : 0, ease: 'anticipate' }}
        >
            <ItemTableListStickyUI
                calculatedColumnWidths={displayColumnWidths}
                CellComponent={optimizedCellComponent}
                containerRef={containerRef}
                data={data}
                enableHeader={!!enableHeader}
                enableStickyGroupRows={!!enableStickyGroupRows}
                enableStickyHeader={!!enableStickyHeader}
                getRowHeightWrapper={getRowHeightWrapper}
                groups={groups}
                headerHeight={headerHeight}
                internalState={internalState}
                parsedColumns={parsedColumns}
                pinnedLeftColumnCount={pinnedLeftColumnCount}
                pinnedLeftColumnRef={pinnedLeftColumnRef}
                pinnedRightColumnCount={pinnedRightColumnCount}
                pinnedRightColumnRef={pinnedRightColumnRef}
                pinnedRowRef={pinnedRowRef}
                rowHeight={rowHeight}
                rowRef={rowRef}
                size={size}
                stickyHeaderItemProps={stickyHeaderItemProps}
                totalColumnCount={totalColumnCount}
            />
            <MemoizedVirtualizedTableGrid
                calculatedColumnWidths={displayColumnWidths}
                CellComponent={optimizedCellComponent}
                data={data}
                dataWithGroups={dataWithGroups}
                enableScrollShadow={enableScrollShadow}
                getItem={getItem}
                headerHeight={headerHeight}
                mergedRowRef={mergedRowRef}
                onRangeChanged={onRangeChanged}
                parsedColumns={parsedColumns}
                pinnedLeftColumnCount={pinnedLeftColumnCount}
                pinnedLeftColumnRef={pinnedLeftColumnRef}
                pinnedRightColumnCount={pinnedRightColumnCount}
                pinnedRightColumnRef={pinnedRightColumnRef}
                pinnedRowCount={pinnedRowCount}
                pinnedRowRef={pinnedRowRef}
                scrollShadowStore={scrollShadowStore}
                tableConfig={tableConfigValue}
                totalColumnCount={totalColumnCount}
                totalRowCount={totalRowCount}
            />
        </motion.div>
    );

    return (
        <ItemTableListStoreProvider activeRowId={activeRowId}>
            <ItemTableListConfigProvider value={tableConfigValue}>
                {onColumnResized ? (
                    <ItemTableListColumnResizeLiveProvider value={columnResizeLiveValue}>
                        {tableMotion}
                    </ItemTableListColumnResizeLiveProvider>
                ) : (
                    tableMotion
                )}
            </ItemTableListConfigProvider>
        </ItemTableListStoreProvider>
    );
};

export const ItemTableList = memo(BaseItemTableList);

ItemTableList.displayName = 'ItemTableList';
