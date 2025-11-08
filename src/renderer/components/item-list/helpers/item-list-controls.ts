import { useMemo } from 'react';

import { ItemListItem } from '/@/renderer/components/item-list/helpers/item-list-state';
import { DefaultItemControlProps, ItemControls } from '/@/renderer/components/item-list/types';
import { usePlayerContext } from '/@/renderer/features/player/context/player-context';
import { Play } from '/@/shared/types/types';

export const useDefaultItemListControls = () => {
    const player = usePlayerContext();

    const controls: ItemControls = useMemo(() => {
        return {
            onClick: ({ internalState, item, itemType }: DefaultItemControlProps) => {
                if (!item) {
                    return;
                }

                const itemListItem: ItemListItem = {
                    _serverId: item._serverId,
                    id: item.id,
                    itemType,
                };

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
