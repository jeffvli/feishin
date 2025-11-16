import clsx from 'clsx';
import { useId, useMemo } from 'react';

import styles from './simple-item-table.module.css';

import { createExtractRowId } from '/@/renderer/components/item-list/helpers/extract-row-id';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useItemListState } from '/@/renderer/components/item-list/helpers/item-list-state';
import { parseTableColumns } from '/@/renderer/components/item-list/helpers/parse-table-columns';
import { TableItemProps } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { TableColumnHeaderContainer } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { Table } from '/@/shared/components/table/table';
import { LibraryItem } from '/@/shared/types/domain-types';

enum TableItemSize {
    COMPACT = 40,
    DEFAULT = 64,
    LARGE = 88,
}

interface SimpleItemTableProps {
    cellPadding?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
    columns: ItemTableListColumnConfig[];
    data: unknown[];
    enableAlternateRowColors?: boolean;
    enableHeader?: boolean;
    enableHorizontalBorders?: boolean;
    enableRowHoverHighlight?: boolean;
    enableSelection?: boolean;
    enableVerticalBorders?: boolean;
    getRowId?: ((item: unknown) => string) | string;
    itemType: LibraryItem;
    size?: 'compact' | 'default' | 'large';
}

export const SimpleItemTable = ({
    cellPadding = 'sm',
    columns,
    data,
    enableAlternateRowColors = false,
    enableHeader = true,
    enableHorizontalBorders = false,
    enableRowHoverHighlight = true,
    enableSelection = true,
    enableVerticalBorders = false,
    getRowId,
    itemType,
    size = 'default',
}: SimpleItemTableProps) => {
    const tableId = useId();
    const playerContext = usePlayer();

    // Filter out pinned columns by setting pinned to null
    const columnsWithoutPinning = useMemo(
        () =>
            columns.map((col) => ({
                ...col,
                pinned: null,
            })),
        [columns],
    );

    // Parse columns (filters disabled and sorts by pinned position, but we've removed pinning)
    const parsedColumns = useMemo(
        () => parseTableColumns(columnsWithoutPinning),
        [columnsWithoutPinning],
    );

    // Create extractRowId function
    const extractRowId = useMemo(() => createExtractRowId(getRowId), [getRowId]);

    // Use item list state for selection
    const internalState = useItemListState(() => data, extractRowId);

    // Get default item controls
    const controls = useDefaultItemListControls();

    // Calculate row height based on size
    const DEFAULT_ROW_HEIGHT = useMemo(() => {
        switch (size) {
            case 'compact':
                return TableItemSize.COMPACT;
            case 'large':
                return TableItemSize.LARGE;
            case 'default':
            default:
                return TableItemSize.DEFAULT;
        }
    }, [size]);

    const tableItemProps: TableItemProps = useMemo(
        () => ({
            cellPadding,
            columns: parsedColumns,
            controls,
            data: enableHeader ? [null, ...data] : data,
            enableAlternateRowColors,
            enableColumnReorder: false,
            enableColumnResize: false,
            enableDrag: false,
            enableExpansion: false,
            enableHeader,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            getRowHeight: () => DEFAULT_ROW_HEIGHT,
            internalState,
            itemType,
            playerContext,
            size,
            tableId,
        }),
        [
            cellPadding,
            parsedColumns,
            controls,
            enableHeader,
            data,
            enableAlternateRowColors,
            enableHorizontalBorders,
            enableRowHoverHighlight,
            enableSelection,
            enableVerticalBorders,
            DEFAULT_ROW_HEIGHT,
            internalState,
            itemType,
            playerContext,
            size,
            tableId,
        ],
    );

    return (
        <div className={styles.simpleItemTableContainer}>
            <Table
                highlightOnHover={enableRowHoverHighlight}
                striped={enableAlternateRowColors}
                withColumnBorders={enableVerticalBorders}
                withRowBorders={enableHorizontalBorders}
            >
                {enableHeader && (
                    <Table.Thead>
                        <Table.Tr>
                            {parsedColumns.map((column, columnIndex) => (
                                <Table.Th
                                    key={column.id}
                                    style={{
                                        textAlign:
                                            column.align === 'start'
                                                ? 'left'
                                                : column.align === 'end'
                                                  ? 'right'
                                                  : 'center',
                                        width: column.width,
                                    }}
                                >
                                    <TableColumnHeaderContainer
                                        {...tableItemProps}
                                        ariaAttributes={{
                                            'aria-colindex': columnIndex + 1,
                                            role: 'gridcell',
                                        }}
                                        columnIndex={columnIndex}
                                        controls={controls}
                                        rowIndex={0}
                                        style={{ width: column.width }}
                                        type={column.id}
                                    />
                                </Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                )}
                <Table.Tbody>
                    {data.map((item, rowIndex) => {
                        const adjustedRowIndex = enableHeader ? rowIndex + 1 : rowIndex;
                        const isSelected =
                            item && typeof item === 'object' && 'id' in item
                                ? internalState.isSelected(internalState.extractRowId(item) || '')
                                : false;

                        const isLastRow = rowIndex === data.length - 1;

                        return (
                            <Table.Tr
                                className={clsx({
                                    [styles.alternateRowEven]:
                                        enableAlternateRowColors && rowIndex % 2 === 0,
                                    [styles.alternateRowOdd]:
                                        enableAlternateRowColors && rowIndex % 2 === 1,
                                    [styles.rowHover]: enableRowHoverHighlight,
                                    [styles.rowSelected]: isSelected,
                                    [styles.withHorizontalBorder]:
                                        enableHorizontalBorders && enableHeader && !isLastRow,
                                })}
                                data-row-index={`${tableId}-${adjustedRowIndex}`}
                                key={internalState.extractRowId(item) || rowIndex}
                            >
                                {parsedColumns.map((column, columnIndex) => {
                                    const isLastColumn = columnIndex === parsedColumns.length - 1;

                                    return (
                                        <Table.Td
                                            className={clsx({
                                                [styles.withVerticalBorder]:
                                                    enableVerticalBorders && !isLastColumn,
                                            })}
                                            key={column.id}
                                            style={{
                                                textAlign:
                                                    column.align === 'start'
                                                        ? 'left'
                                                        : column.align === 'end'
                                                          ? 'right'
                                                          : 'center',
                                                width: column.width,
                                            }}
                                        >
                                            <ItemTableListColumn
                                                {...tableItemProps}
                                                ariaAttributes={{
                                                    'aria-colindex': columnIndex + 1,
                                                    role: 'gridcell',
                                                }}
                                                columnIndex={columnIndex}
                                                rowIndex={adjustedRowIndex}
                                                style={{ width: column.width }}
                                            />
                                        </Table.Td>
                                    );
                                })}
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </div>
    );
};
