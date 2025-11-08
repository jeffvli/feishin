import { useMemo } from 'react';

import { ItemListItem } from '/@/renderer/components/item-list/helpers/item-list-state';
import { DefaultItemControlProps, ItemControls } from '/@/renderer/components/item-list/types';
import { usePlayerContext } from '/@/renderer/features/player/context/player-context';
import { Play } from '/@/shared/types/types';

export const useDefaultItemListControls = () => {
    const player = usePlayerContext();

    const controls: ItemControls = useMemo(() => {
        return {
            onClick: ({ event, internalState, item, itemType }: DefaultItemControlProps) => {
                if (!item || !internalState || !event) {
                    return;
                }

                const itemListItem: ItemListItem = {
                    _serverId: item._serverId,
                    id: item.id,
                    itemType,
                };

                // Check if ctrl/cmd key is held for multi-selection
                if (event.ctrlKey || event.metaKey) {
                    const isCurrentlySelected = internalState.isSelected(item.id);

                    if (isCurrentlySelected) {
                        // Remove this item from selection
                        const currentSelected = internalState.getSelected();
                        const filteredSelected = currentSelected.filter(
                            (selectedItem) => selectedItem.id !== item.id,
                        );
                        internalState.setSelected(filteredSelected);
                    } else {
                        // Add this item to selection
                        const currentSelected = internalState.getSelected();
                        const newSelected = [...currentSelected, itemListItem];
                        internalState.setSelected(newSelected);
                    }
                }
                // Check if shift key is held for range selection
                else if (event.shiftKey) {
                    const selectedItems = internalState.getSelected();
                    const lastSelectedItem = selectedItems[selectedItems.length - 1];

                    if (lastSelectedItem) {
                        // Get the data array from internalState
                        const data = internalState.getData();
                        // Filter out null/undefined values (e.g., header row)
                        const validData = data.filter(
                            (d) => d && typeof d === 'object' && 'id' in d,
                        );

                        // Find the indices of the last selected item and current item
                        const lastIndex = internalState.findItemIndex(lastSelectedItem.id);
                        const currentIndex = internalState.findItemIndex(item.id);

                        if (lastIndex !== -1 && currentIndex !== -1) {
                            // Create range selection - select ALL items in the range
                            const startIndex = Math.min(lastIndex, currentIndex);
                            const stopIndex = Math.max(lastIndex, currentIndex);

                            const rangeItems: ItemListItem[] = [];
                            for (let i = startIndex; i <= stopIndex; i++) {
                                const rangeItem = validData[i];
                                if (
                                    rangeItem &&
                                    typeof rangeItem === 'object' &&
                                    'id' in rangeItem &&
                                    '_serverId' in rangeItem
                                ) {
                                    rangeItems.push({
                                        _serverId: (rangeItem as any)._serverId,
                                        id: (rangeItem as any).id,
                                        itemType,
                                    });
                                }
                            }

                            // Merge with existing selection, avoiding duplicates
                            const currentSelected = internalState.getSelected();
                            const newSelected = [...currentSelected];
                            rangeItems.forEach((rangeItem) => {
                                if (!newSelected.some((selected) => selected.id === rangeItem.id)) {
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
                        selectedItems.length === 1 && selectedItems[0].id === item.id;

                    if (isOnlySelected) {
                        internalState.clearSelected();
                    } else {
                        internalState.setSelected([itemListItem]);
                    }
                }
            },

            onDoubleClick: ({ internalState, item, itemType }: DefaultItemControlProps) => {
                console.log('onDoubleClick', item, itemType, internalState);
            },

            onExpand: ({ internalState, item, itemType }: DefaultItemControlProps) => {
                if (!item || !internalState) {
                    return;
                }

                return internalState?.toggleExpanded({
                    _serverId: item._serverId,
                    id: item.id,
                    itemType,
                });
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

            onMore: ({ internalState, item, itemType }: DefaultItemControlProps) => {
                console.log('handleItemMore', item, itemType, internalState);
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
    }, [player]);

    return controls;
};
