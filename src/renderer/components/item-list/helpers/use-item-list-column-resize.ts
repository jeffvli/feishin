import { useCallback } from 'react';

import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { ItemListKey, TableColumn } from '/@/shared/types/types';

interface UseItemListColumnResizeProps {
    itemListKey: ItemListKey;
    tableKey?: 'detail' | 'main';
}

export const useItemListColumnResize = ({
    itemListKey,
    tableKey = 'main',
}: UseItemListColumnResizeProps) => {
    const { setList } = useSettingsStoreActions();

    const handleColumnResized = useCallback(
        (columnId: TableColumn, width: number, widths?: Partial<Record<TableColumn, number>>) => {
            // fresh read so multi-column persists don't stomp each other
            const list = useSettingsStore.getState().lists[itemListKey];
            const columns = tableKey === 'detail' ? list?.detail?.columns : list?.table?.columns;
            if (!columns) return;

            const updates = widths ? { ...widths, [columnId]: width } : { [columnId]: width };

            const updatedColumns = columns.map((column) => {
                const nextWidth = updates[column.id];
                if (nextWidth == null) return column;
                // Freeze the on-screen row so the layout pass doesn't reflow on mouseup.
                return widths
                    ? { ...column, autoSize: false, width: nextWidth }
                    : { ...column, width: nextWidth };
            });

            if (tableKey === 'detail') {
                type SetListData = Parameters<
                    ReturnType<typeof useSettingsStoreActions>['setList']
                >[1];
                setList(itemListKey, { detail: { columns: updatedColumns } } as SetListData);
            } else {
                setList(itemListKey, {
                    table: {
                        columns: updatedColumns,
                    },
                });
            }
        },
        [itemListKey, setList, tableKey],
    );

    return { handleColumnResized };
};
