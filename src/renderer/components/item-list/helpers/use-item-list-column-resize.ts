import { useCallback } from 'react';

import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { ItemListKey, TableColumn } from '/@/shared/types/types';

interface UseItemListColumnResizeProps {
    itemListKey: ItemListKey;
}

export const useItemListColumnResize = ({ itemListKey }: UseItemListColumnResizeProps) => {
    const { setList } = useSettingsStoreActions();
    const columns = useSettingsStore((state) => state.lists[itemListKey]?.table.columns);

    const handleColumnResized = useCallback(
        (columnId: TableColumn, width: number) => {
            if (!columns) return;

            const updatedColumns = columns.map((column) =>
                column.id === columnId ? { ...column, width } : column,
            );

            setList(itemListKey, {
                table: {
                    columns: updatedColumns,
                },
            });
        },
        [columns, itemListKey, setList],
    );

    return { handleColumnResized };
};
