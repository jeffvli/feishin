import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';

/**
 * Sorts table columns by their pinned position and filters out disabled columns:
 * - Left pinned columns come first (maintaining their original order)
 * - Unpinned columns come next (maintaining their original order)
 * - Right pinned columns come last (maintaining their original order)
 * - Columns with isEnabled: false are removed
 */
export const parseTableColumns = (
    columns: ItemTableListColumnConfig[],
): ItemTableListColumnConfig[] => {
    const leftPinned: ItemTableListColumnConfig[] = [];
    const unpinned: ItemTableListColumnConfig[] = [];
    const rightPinned: ItemTableListColumnConfig[] = [];

    // Separate columns by pinned position while maintaining original order
    // Only include columns that are enabled (isEnabled !== false)
    columns.forEach((column) => {
        if (column.isEnabled === false) {
            return;
        }

        switch (column.pinned) {
            case 'left':
                leftPinned.push(column);
                break;
            case 'right':
                rightPinned.push(column);
                break;
            case null:
            default:
                unpinned.push(column);
                break;
        }
    });

    // Combine in the desired order: left pinned, unpinned, right pinned
    return [...leftPinned, ...unpinned, ...rightPinned];
};
