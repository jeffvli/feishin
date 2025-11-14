import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { useCallback } from 'react';

import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { ItemListKey, TableColumn } from '/@/shared/types/types';

interface UseItemListColumnReorderProps {
    itemListKey: ItemListKey;
}

export const useItemListColumnReorder = ({ itemListKey }: UseItemListColumnReorderProps) => {
    const { setList } = useSettingsStoreActions();

    const handleColumnReordered = useCallback(
        (columnIdFrom: TableColumn, columnIdTo: TableColumn, edge: Edge | null) => {
            const columns = useSettingsStore.getState().lists[itemListKey]?.table.columns;

            if (!columns) {
                return;
            }

            const indexFrom = columns.findIndex((column) => column.id === columnIdFrom);
            const indexTo = columns.findIndex((column) => column.id === columnIdTo);

            // If either column not found or dragging to the same position, do nothing
            if (indexFrom === -1 || indexTo === -1 || indexFrom === indexTo) {
                return;
            }

            const targetColumn = columns[indexTo];

            // Create a new array to avoid mutating the original
            const newColumns = [...columns];

            // Remove the column from its current position
            const [movedColumn] = newColumns.splice(indexFrom, 1);

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

            // Calculate the new insertion index based on edge
            // After removing the item, indices shift:
            // - If removing from before the target, target index decreases by 1
            // - If removing from after the target, target index stays the same
            let newIndex: number;

            if (edge === 'left') {
                // Insert before the target column
                if (indexFrom < indexTo) {
                    // Removed item was before target, so target shifted left by 1
                    newIndex = indexTo - 1;
                } else {
                    // Removed item was after target, target index unchanged
                    newIndex = indexTo;
                }
            } else if (edge === 'right') {
                // Insert after the target column
                if (indexFrom < indexTo) {
                    // Removed item was before target, so target shifted left by 1
                    newIndex = indexTo;
                } else {
                    // Removed item was after target, target index unchanged
                    newIndex = indexTo + 1;
                }
            } else {
                // No edge specified, default to inserting after the target position
                if (indexFrom < indexTo) {
                    newIndex = indexTo;
                } else {
                    newIndex = indexTo + 1;
                }
            }

            // Insert the column at the new position
            newColumns.splice(newIndex, 0, updatedMovedColumn);

            setList(itemListKey, {
                table: {
                    columns: newColumns,
                },
            });
        },
        [itemListKey, setList],
    );

    return { handleColumnReordered };
};
