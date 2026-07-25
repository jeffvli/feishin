import { ItemTableListColumnConfig } from '/@/renderer/store';
import { TableColumn } from '/@/shared/types/types';

/**
 * Flat, artwork-free column layout: index, title, artist, album, date added, duration.
 */
export const FLAT_COLUMN_ORDER: TableColumn[] = [
    TableColumn.ROW_INDEX,
    TableColumn.TITLE,
    TableColumn.ARTIST,
    TableColumn.ALBUM,
    TableColumn.DATE_ADDED,
    TableColumn.DURATION,
];

/**
 * Enables and reorders the columns in `order`, keeping every other column in place but disabled.
 * Widths, pins and alignment the user configured are preserved.
 */
export const applyColumnOrder = (
    columns: ItemTableListColumnConfig[],
    order: TableColumn[],
): ItemTableListColumnConfig[] => {
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ordered = order
        .map((id) => byId.get(id))
        .filter((column): column is ItemTableListColumnConfig => column !== undefined)
        .map((column) => ({ ...column, isEnabled: true }));

    const orderedIds = new Set(ordered.map((column) => column.id));
    const rest = columns
        .filter((column) => !orderedIds.has(column.id))
        .map((column) => ({ ...column, isEnabled: false }));

    return [...ordered, ...rest];
};

/**
 * True when the enabled columns are exactly `order` (minus any column this list doesn't have).
 */
export const isColumnOrderActive = (
    columns: ItemTableListColumnConfig[],
    order: TableColumn[],
): boolean => {
    const availableIds = new Set(columns.map((column) => column.id));
    const expected = order.filter((id) => availableIds.has(id));
    const enabled = columns.filter((column) => column.isEnabled).map((column) => column.id);

    return (
        expected.length > 0 &&
        enabled.length === expected.length &&
        enabled.every((id, index) => id === expected[index])
    );
};
