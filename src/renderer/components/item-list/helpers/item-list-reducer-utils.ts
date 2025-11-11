import {
    ItemListAction,
    ItemListState,
    ItemListStateItemWithRequiredProperties,
} from './item-list-state';

/**
 * Action creators for item grid state management
 * These can be reused across different components and contexts
 */
export const itemGridActions = {
    clearAll: (): ItemListAction => ({
        type: 'CLEAR_ALL',
    }),

    clearExpanded: (): ItemListAction => ({
        type: 'CLEAR_EXPANDED',
    }),

    clearSelected: (): ItemListAction => ({
        type: 'CLEAR_SELECTED',
    }),

    setDragging: (items: ItemListStateItemWithRequiredProperties[]): ItemListAction => ({
        payload: items,
        type: 'SET_DRAGGING',
    }),

    setExpanded: (items: ItemListStateItemWithRequiredProperties[]): ItemListAction => ({
        payload: items,
        type: 'SET_EXPANDED',
    }),

    setSelected: (items: ItemListStateItemWithRequiredProperties[]): ItemListAction => ({
        payload: items,
        type: 'SET_SELECTED',
    }),

    toggleExpanded: (item: ItemListStateItemWithRequiredProperties): ItemListAction => ({
        payload: item,
        type: 'TOGGLE_EXPANDED',
    }),

    toggleSelected: (item: ItemListStateItemWithRequiredProperties): ItemListAction => ({
        payload: item,
        type: 'TOGGLE_SELECTED',
    }),
};

/**
 * Selector functions for item grid state
 * These can be reused to extract specific data from state
 */
export const itemGridSelectors = {
    getDragging: (state: ItemListState): unknown[] => {
        return Array.from(state.draggingItems.values());
    },

    getDraggingCount: (state: ItemListState): number => {
        return state.dragging.size;
    },

    getDraggingIds: (state: ItemListState): string[] => {
        return Array.from(state.dragging);
    },

    getExpanded: (state: ItemListState): unknown[] => {
        return Array.from(state.expandedItems.values());
    },

    getExpandedCount: (state: ItemListState): number => {
        return state.expanded.size;
    },

    getExpandedIds: (state: ItemListState): string[] => {
        return Array.from(state.expanded);
    },

    getSelected: (state: ItemListState): unknown[] => {
        return Array.from(state.selectedItems.values());
    },

    getSelectedCount: (state: ItemListState): number => {
        return state.selected.size;
    },

    getSelectedIds: (state: ItemListState): string[] => {
        return Array.from(state.selected);
    },

    getVersion: (state: ItemListState): number => {
        return state.version;
    },

    hasAnyDragging: (state: ItemListState): boolean => {
        return state.dragging.size > 0;
    },

    hasAnyExpanded: (state: ItemListState): boolean => {
        return state.expanded.size > 0;
    },

    hasAnySelected: (state: ItemListState): boolean => {
        return state.selected.size > 0;
    },

    isDragging: (state: ItemListState, itemId: string): boolean => {
        return state.dragging.has(itemId);
    },

    isExpanded: (state: ItemListState, itemId: string): boolean => {
        return state.expanded.has(itemId);
    },

    isSelected: (state: ItemListState, itemId: string): boolean => {
        return state.selected.has(itemId);
    },
};

export const itemListUtils = {
    /**
     * Check if all items in a list are selected
     */
    areAllSelected: (state: ItemListState, itemIds: string[]): boolean => {
        return itemIds.every((id) => state.selected.has(id));
    },

    /**
     * Check if any items in a list are selected
     */
    areAnySelected: (state: ItemListState, itemIds: string[]): boolean => {
        return itemIds.some((id) => state.selected.has(id));
    },

    /**
     * Check if multiple items are expanded
     */
    isMultiExpand: (state: ItemListState): boolean => {
        return state.expanded.size > 1;
    },

    /**
     * Check if multiple items are selected
     */
    isMultiSelect: (state: ItemListState): boolean => {
        return state.selected.size > 1;
    },

    /**
     * Toggle expansion of all items in a list
     */
    toggleAllExpanded: (
        items: ItemListStateItemWithRequiredProperties[],
        currentState: ItemListState,
    ): ItemListAction => {
        const allExpanded = items.every((item) => currentState.expanded.has(item.id));
        return allExpanded ? itemGridActions.clearExpanded() : itemGridActions.setExpanded(items);
    },

    /**
     * Toggle selection of all items in a list
     */
    toggleAllSelected: (
        items: ItemListStateItemWithRequiredProperties[],
        currentState: ItemListState,
    ): ItemListAction => {
        const allSelected = items.every((item) => currentState.selected.has(item.id));
        return allSelected ? itemGridActions.clearSelected() : itemGridActions.setSelected(items);
    },
};
