import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { TableColumn } from '/@/shared/types/types';

const LAYOUT_FILL_COLUMN: ItemTableListColumnConfig = {
    align: 'start',
    autoSize: true,
    id: TableColumn.LAYOUT_FILL,
    isEnabled: true,
    pinned: null,
    width: 0,
};

export const appendLayoutFillColumn = (
    columns: ItemTableListColumnConfig[],
    autoFitColumns: boolean,
): ItemTableListColumnConfig[] => {
    if (autoFitColumns || columns.length === 0) {
        return columns;
    }

    const unpinnedEnabled = columns.filter((c) => c.pinned === null && c.isEnabled !== false);
    if (unpinnedEnabled.length === 0) {
        return columns;
    }
    if (unpinnedEnabled.some((c) => c.autoSize === true)) {
        return columns;
    }

    return [...columns, LAYOUT_FILL_COLUMN];
};
