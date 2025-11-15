import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import { ItemListStateItemWithRequiredProperties } from '/@/renderer/components/item-list/helpers/item-list-state';
import { DefaultItemControlProps, ItemControls } from '/@/renderer/components/item-list/types';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { Play, TableColumn } from '/@/shared/types/types';

interface UseDefaultItemListControlsArgs {
    onColumnReordered?: (
        columnIdFrom: TableColumn,
        columnIdTo: TableColumn,
        edge: 'bottom' | 'left' | 'right' | 'top' | null,
    ) => void;
    onColumnResized?: (columnId: TableColumn, width: number) => void;
}

export const useDefaultItemListControls = (args?: UseDefaultItemListControlsArgs) => {
    const player = usePlayer();
    const navigate = useNavigate();

    const { onColumnReordered, onColumnResized } = args || {};

    const controls: ItemControls = useMemo(() => {
        return {
            onClick: ({ event, internalState, item }: DefaultItemControlProps) => {
                if (!item || !internalState || !event) {
                    return;
                }

                // Extract rowId from the item
                const rowId = internalState.extractRowId(item);
                if (!rowId) return;

                // Use the item directly (rowId is separate, used only as key in state)
                const itemListItem = item as ItemListStateItemWithRequiredProperties;

                // Check if ctrl/cmd key is held for multi-selection
                if (event.ctrlKey || event.metaKey) {
                    const isCurrentlySelected = internalState.isSelected(rowId);

                    if (isCurrentlySelected) {
                        // Remove this item from selection
                        const currentSelected = internalState.getSelected();
                        const filteredSelected = currentSelected.filter(
                            (
                                selectedItem,
                            ): selectedItem is ItemListStateItemWithRequiredProperties =>
                                typeof selectedItem === 'object' &&
                                selectedItem !== null &&
                                internalState.extractRowId(selectedItem) !== rowId,
                        );
                        internalState.setSelected(filteredSelected);
                    } else {
                        // Add this item to selection
                        const currentSelected = internalState.getSelected();
                        const newSelected = [
                            ...currentSelected.filter(
                                (
                                    selectedItem,
                                ): selectedItem is ItemListStateItemWithRequiredProperties =>
                                    typeof selectedItem === 'object' && selectedItem !== null,
                            ),
                            itemListItem,
                        ];
                        internalState.setSelected(newSelected);
                    }
                }
                // Check if shift key is held for range selection
                else if (event.shiftKey) {
                    const selectedItems = internalState.getSelected();
                    const lastSelectedItem = selectedItems[selectedItems.length - 1];

                    if (
                        lastSelectedItem &&
                        typeof lastSelectedItem === 'object' &&
                        lastSelectedItem !== null
                    ) {
                        // Get the data array from internalState
                        const data = internalState.getData();
                        // Filter out null/undefined values (e.g., header row)
                        const validData = data.filter((d) => d && typeof d === 'object');

                        // Find the indices of the last selected item and current item
                        const lastRowId = internalState.extractRowId(lastSelectedItem);
                        if (!lastRowId) return;
                        const lastIndex = internalState.findItemIndex(lastRowId);
                        const currentIndex = internalState.findItemIndex(rowId);

                        if (lastIndex !== -1 && currentIndex !== -1) {
                            // Create range selection - select ALL items in the range
                            const startIndex = Math.min(lastIndex, currentIndex);
                            const stopIndex = Math.max(lastIndex, currentIndex);

                            const rangeItems: ItemListStateItemWithRequiredProperties[] = [];
                            for (let i = startIndex; i <= stopIndex; i++) {
                                const rangeItem = validData[i];
                                if (
                                    rangeItem &&
                                    typeof rangeItem === 'object' &&
                                    '_serverId' in rangeItem &&
                                    '_itemType' in rangeItem
                                ) {
                                    const rangeRowId = internalState.extractRowId(rangeItem);
                                    if (rangeRowId) {
                                        rangeItems.push(
                                            rangeItem as ItemListStateItemWithRequiredProperties,
                                        );
                                    }
                                }
                            }

                            // Merge with existing selection, avoiding duplicates
                            const currentSelected = internalState.getSelected();
                            const newSelected = [
                                ...currentSelected.filter(
                                    (
                                        selectedItem,
                                    ): selectedItem is ItemListStateItemWithRequiredProperties =>
                                        typeof selectedItem === 'object' && selectedItem !== null,
                                ),
                            ];
                            rangeItems.forEach((rangeItem) => {
                                const rangeRowId = internalState.extractRowId(rangeItem);
                                if (
                                    rangeRowId &&
                                    !newSelected.some(
                                        (selected) =>
                                            internalState.extractRowId(selected) === rangeRowId,
                                    )
                                ) {
                                    newSelected.push(rangeItem);
                                }
                            });
                            internalState.setSelected(newSelected);
                        }
                    } else {
                        // No previous selection, just select this item
                        internalState.setSelected([itemListItem]);
                    }
                } else {
                    // Regular click - deselect all others and select only this item
                    // If this item is already the only selected item, deselect it
                    const selectedItems = internalState.getSelected();
                    const isOnlySelected =
                        selectedItems.length === 1 &&
                        typeof selectedItems[0] === 'object' &&
                        selectedItems[0] !== null &&
                        internalState.extractRowId(selectedItems[0]) === rowId;

                    if (isOnlySelected) {
                        internalState.clearSelected();
                    } else {
                        internalState.setSelected([itemListItem]);
                    }
                }
            },

            onColumnReordered: ({
                columnIdFrom,
                columnIdTo,
                edge,
            }: {
                columnIdFrom: TableColumn;
                columnIdTo: TableColumn;
                edge: 'bottom' | 'left' | 'right' | 'top' | null;
            }) => {
                onColumnReordered?.(columnIdFrom, columnIdTo, edge);
            },

            onColumnResized: ({ columnId, width }: { columnId: TableColumn; width: number }) => {
                onColumnResized?.(columnId, width);
            },

            onDoubleClick: ({ internalState, item, itemType }: DefaultItemControlProps) => {
                if (!item || !internalState) {
                    return;
                }

                internalState.setSelected([item]);

                if (
                    itemType === LibraryItem.ALBUM ||
                    itemType === LibraryItem.ALBUM_ARTIST ||
                    itemType === LibraryItem.ARTIST ||
                    itemType === LibraryItem.GENRE ||
                    itemType === LibraryItem.PLAYLIST
                ) {
                    const path = getTitlePath(itemType, item.id);
                    if (path) {
                        navigate(path);
                        return;
                    }
                }

                if (itemType === LibraryItem.QUEUE_SONG) {
                    const queueSong = item as QueueSong;
                    if (queueSong._uniqueId) {
                        player.mediaPlay(queueSong._uniqueId);
                    }
                }
            },

            onExpand: ({ internalState, item }: DefaultItemControlProps) => {
                if (!item || !internalState) {
                    return;
                }

                // Extract rowId from the item
                const rowId = internalState.extractRowId(item);
                if (!rowId) return;

                // Use the item directly (rowId is separate, used only as key in state)
                const itemListItem = item as ItemListStateItemWithRequiredProperties;

                return internalState?.toggleExpanded(itemListItem);
            },

            onFavorite: ({
                favorite,
                item,
                itemType,
            }: DefaultItemControlProps & { favorite: boolean }) => {
                if (!item) {
                    return;
                }

                player.setFavorite(item._serverId, [item.id], itemType, favorite);
            },

            onMore: ({ event, internalState, item, itemType }: DefaultItemControlProps) => {
                if (!item || !internalState || !event) {
                    return;
                }

                const rowId = internalState.extractRowId(item);

                if (!rowId) return;

                // If none selected, select this item
                if (internalState.getSelected().length === 0) {
                    internalState.setSelected([item]);
                    return ContextMenuController.call({
                        cmd: { items: [item] as any[], type: itemType as any },
                        event,
                    });
                }
                // If this item is not already selected, replace the selection with this item
                else if (!internalState.isSelected(rowId)) {
                    internalState.setSelected([item]);
                    return ContextMenuController.call({
                        cmd: { items: [item] as any[], type: itemType as any },
                        event,
                    });
                }

                const selectedItems = internalState.getSelected();

                return ContextMenuController.call({
                    cmd: { items: selectedItems as any[], type: itemType as any },
                    event,
                });
            },

            onPlay: ({
                item,
                itemType,
                playType,
            }: DefaultItemControlProps & { playType: Play }) => {
                if (!item) {
                    return;
                }

                player.addToQueueByFetch(item._serverId, [item.id], itemType, playType);
            },

            onRating: ({
                item,
                itemType,
                rating,
            }: DefaultItemControlProps & { rating: number }) => {
                if (!item) {
                    return;
                }

                const previousRating = (item as { userRating: number }).userRating || 0;

                let newRating = rating;

                if (previousRating === rating) {
                    newRating = 0;
                }

                player.setRating(item._serverId, [item.id], itemType, newRating);
            },
        };
    }, [onColumnReordered, onColumnResized, navigate, player]);

    return controls;
};
