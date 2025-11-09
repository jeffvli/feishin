import {
    ItemListStateActions,
    ItemListStateItem,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';

/**
 * Converts domain data to ItemListStateItem format
 */
const convertToItemListItem = (
    data: Album | AlbumArtist | Artist | Playlist | Song,
    itemType: LibraryItem,
): ItemListStateItem => {
    return {
        _serverId: data._serverId,
        id: data.id,
        itemType,
    };
};

/**
 * Gets the items that should be dragged based on the current data and selection state.
 * If the current item is already selected, drag all selected items.
 * Otherwise, select and drag only the current item.
 *
 * @param data - The item data to drag (Album, AlbumArtist, Artist, Playlist, or Song)
 * @param itemType - The type of library item
 * @param internalState - The item list state actions (optional)
 * @param updateSelection - Whether to update the selection state (default: true)
 * @returns Array of ItemListItem objects that should be dragged
 */
export const getDraggedItems = (
    data: Album | AlbumArtist | Artist | Playlist | Song | undefined,
    itemType: LibraryItem,
    internalState?: ItemListStateActions,
    updateSelection: boolean = true,
): ItemListStateItem[] => {
    if (!data || !internalState) {
        return [];
    }

    // Convert data to ItemListStateItem format
    const draggedItem = convertToItemListItem(data, itemType);

    const previouslySelected = internalState.getSelected();
    const isDraggingSelectedItem = previouslySelected.some((selected) => selected.id === data.id);

    const draggedItems: ItemListStateItem[] = [];

    if (isDraggingSelectedItem) {
        // If dragging a selected item, drag all selected items
        draggedItems.push(...previouslySelected);
    } else {
        // If dragging an unselected item, select it and drag only it
        if (updateSelection) {
            internalState.setSelected([draggedItem]);
        }
        draggedItems.push(draggedItem);
    }

    return draggedItems;
};
