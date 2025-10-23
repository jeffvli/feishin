import { MouseEvent } from 'react';

import {
    ItemListItem,
    ItemListStateActions,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const handleItemClick = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    if (!item) {
        return;
    }

    const itemListItem: ItemListItem = {
        id: item.id,
        itemType,
        serverId: item.serverId,
    };

    // Regular click - deselect all others and select only this item
    // If this item is already the only selected item, deselect it
    const selectedItems = internalState.getSelected();
    const isOnlySelected = selectedItems.length === 1 && selectedItems[0].id === item.id;

    if (isOnlySelected) {
        internalState.clearSelected();
    } else {
        internalState.setSelected([itemListItem]);
    }
};

const handleItemDoubleClick = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemDoubleClick', item, itemType, internalState);
};

const handleItemExpand = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    if (!item) {
        return;
    }

    return internalState.toggleExpanded({
        id: item.id,
        itemType,
        serverId: item.serverId,
    });
};

const handleItemFavorite = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemFavorite', item, itemType, internalState);
};

const handleItemRating = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemRating', item, itemType, internalState);
};

const handleItemMore = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemMore', item, itemType, internalState);
};

const handleItemPlay = (
    item: (ItemListItem & object) | undefined,
    itemType: LibraryItem,
    playType: Play,
    internalState: ItemListStateActions,
) => {
    console.log('handleItemPlay', item, itemType, playType, internalState);
};

export const itemListControls = {
    handleItemClick,
    handleItemDoubleClick,
    handleItemExpand,
    handleItemFavorite,
    handleItemMore,
    handleItemPlay,
    handleItemRating,
};
