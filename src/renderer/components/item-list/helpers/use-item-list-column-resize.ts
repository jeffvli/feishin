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
    const columns = useSettingsStore((state) => {
        const list = state.lists[itemListKey];
        return tableKey === 'detail' ? list?.detail?.columns : list?.table?.columns;
    });

    const handleColumnResized = useCallback(
        (columnId: TableColumn, width: number) => {
            if (!columns) return;

            const updatedColumns = columns.map((column) =>
                column.id === columnId ? { ...column, width } : column,
            );

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
        [columns, itemListKey, setList, tableKey],
    );

    return { handleColumnResized };
};
