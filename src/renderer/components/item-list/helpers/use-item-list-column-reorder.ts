import { useCallback } from 'react';

import { parseTableColumns } from '/@/renderer/components/item-list/helpers/parse-table-columns';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { ItemListKey, TableColumn } from '/@/shared/types/types';

interface UseItemListColumnReorderProps {
    itemListKey: ItemListKey;
    tableKey?: 'detail' | 'main';
}

export const useItemListColumnReorder = ({
    itemListKey,
    tableKey = 'main',
}: UseItemListColumnReorderProps) => {
    const { setList } = useSettingsStoreActions();

    const handleColumnReordered = useCallback(
        (columnIdFrom: TableColumn, columnIdTo: TableColumn) => {
            const list = useSettingsStore.getState().lists[itemListKey];
            const columns = tableKey === 'detail' ? list?.detail?.columns : list?.table?.columns;

            if (!columns) {
                return;
            }

            // Header order is pin-grouped. Closest-edge insert misses a left drop.
            const visual = parseTableColumns(columns);
            const indexFrom = visual.findIndex((column) => column.id === columnIdFrom);
            const indexTo = visual.findIndex((column) => column.id === columnIdTo);

            // If either column not found or dragging to the same position, do nothing
            if (indexFrom === -1 || indexTo === -1 || indexFrom === indexTo) {
                return;
            }

            const targetColumn = visual[indexTo];

            // Create a new array to avoid mutating the original
            const ordered = [...visual];

            // Remove the column from its current position
            const [movedColumn] = ordered.splice(indexFrom, 1);

            // Update pinned status based on target column
            // If dragging onto a pinned left column, pin the moved column to left
            // If dragging onto a pinned right column, pin the moved column to right
            // If dragging onto an unpinned column, unpin the moved column
            const updatedMovedColumn =
                targetColumn.pinned === 'left'
                    ? { ...movedColumn, pinned: 'left' as const }
                    : targetColumn.pinned === 'right'
                      ? { ...movedColumn, pinned: 'right' as const }
                      : { ...movedColumn, pinned: null };

            ordered.splice(indexTo, 0, updatedMovedColumn);

            const visibleIds = new Set(ordered.map((column) => column.id));
            const newColumns = [
                ...ordered,
                ...columns.filter((column) => !visibleIds.has(column.id)),
            ];

            if (tableKey === 'detail') {
                type SetListData = Parameters<
                    ReturnType<typeof useSettingsStoreActions>['setList']
                >[1];
                setList(itemListKey, { detail: { columns: newColumns } } as SetListData);
            } else {
                setList(itemListKey, {
                    table: {
                        columns: newColumns,
                    },
                });
            }
        },
        [itemListKey, setList, tableKey],
    );

    return { handleColumnReordered };
};
