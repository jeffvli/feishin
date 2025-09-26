import { useCallback, useReducer } from 'react';

import { itemGridSelectors } from '/@/renderer/components/item-list/helpers/item-list-reducer-utils';
import { LibraryItem } from '/@/shared/types/domain-types';

export type ItemListAction =
    | { payload: ItemListItem; type: 'TOGGLE_EXPANDED' }
    | { payload: ItemListItem; type: 'TOGGLE_SELECTED' }
    | { payload: ItemListItem[]; type: 'SET_EXPANDED' }
    | { payload: ItemListItem[]; type: 'SET_SELECTED' }
    | { type: 'CLEAR_ALL' }
    | { type: 'CLEAR_EXPANDED' }
    | { type: 'CLEAR_SELECTED' };

export interface ItemListItem {
    id: string;
    itemType: LibraryItem;
}

export interface ItemListState {
    expanded: Set<string>;
    expandedItems: Map<string, ItemListItem>;
    selected: Set<string>;
    selectedItems: Map<string, ItemListItem>;
    version: number;
}

export interface ItemListStateActions {
    clearAll: () => void;
    clearExpanded: () => void;
    clearSelected: () => void;
    getExpanded: () => ItemListItem[];
    getExpandedIds: () => string[];
    getSelected: () => ItemListItem[];
    getSelectedIds: () => string[];
    getVersion: () => number;
    hasExpanded: () => boolean;
    hasSelected: () => boolean;
    isExpanded: (itemId: string) => boolean;
    isSelected: (itemId: string) => boolean;
    setExpanded: (items: ItemListItem[]) => void;
    setSelected: (items: ItemListItem[]) => void;
    toggleExpanded: (item: ItemListItem) => void;
    toggleSelected: (item: ItemListItem) => void;
}

/**
 * Reusable reducer for item grid state management
 * Can be used in different components or contexts
 */
export const itemListReducer = (state: ItemListState, action: ItemListAction): ItemListState => {
    switch (action.type) {
        case 'CLEAR_ALL':
            return {
                ...state,
                expanded: new Set(),
                expandedItems: new Map(),
                selected: new Set(),
                selectedItems: new Map(),
                version: state.version + 1,
            };

        case 'CLEAR_EXPANDED':
            return {
                ...state,
                expanded: new Set(),
                expandedItems: new Map(),
                version: state.version + 1,
            };

        case 'CLEAR_SELECTED':
            return {
                ...state,
                selected: new Set(),
                selectedItems: new Map(),
                version: state.version + 1,
            };

        case 'SET_EXPANDED': {
            const newExpanded = new Set<string>();
            const newExpandedItems = new Map<string, ItemListItem>();

            if (action.payload.length > 0) {
                const firstItem = action.payload[0];
                newExpanded.add(firstItem.id);
                newExpandedItems.set(firstItem.id, firstItem);
            }

            return {
                ...state,
                expanded: newExpanded,
                expandedItems: newExpandedItems,
                version: state.version + 1,
            };
        }

        case 'SET_SELECTED': {
            const newSelected = new Set<string>();
            const newSelectedItems = new Map<string, ItemListItem>();

            action.payload.forEach((item) => {
                newSelected.add(item.id);
                newSelectedItems.set(item.id, item);
            });

            return {
                ...state,
                selected: newSelected,
                selectedItems: newSelectedItems,
                version: state.version + 1,
            };
        }

        case 'TOGGLE_EXPANDED': {
            const newExpanded = new Set<string>();
            const newExpandedItems = new Map<string, ItemListItem>();

            // If the item is already expanded, collapse it
            if (state.expanded.has(action.payload.id)) {
                // Item is expanded, so collapse it (leave sets empty)
            } else {
                // Item is not expanded, so expand it (clear others first for single expansion)
                newExpanded.add(action.payload.id);
                newExpandedItems.set(action.payload.id, action.payload);
            }

            return {
                ...state,
                expanded: newExpanded,
                expandedItems: newExpandedItems,
                version: state.version + 1,
            };
        }

        case 'TOGGLE_SELECTED': {
            const newSelected = new Set(state.selected);
            const newSelectedItems = new Map(state.selectedItems);

            if (newSelected.has(action.payload.id)) {
                newSelected.delete(action.payload.id);
                newSelectedItems.delete(action.payload.id);
            } else {
                newSelected.add(action.payload.id);
                newSelectedItems.set(action.payload.id, action.payload);
            }

            return {
                ...state,
                selected: newSelected,
                selectedItems: newSelectedItems,
                version: state.version + 1,
            };
        }

        default:
            return state;
    }
};

/**
 * Initial state for item grid
 */
export const initialItemListState: ItemListState = {
    expanded: new Set(),
    expandedItems: new Map(),
    selected: new Set(),
    selectedItems: new Map(),
    version: 0,
};

export const useItemListState = (): ItemListStateActions => {
    const [state, dispatch] = useReducer(itemListReducer, initialItemListState);

    const setExpanded = useCallback((items: ItemListItem[]) => {
        dispatch({ payload: items, type: 'SET_EXPANDED' });
    }, []);

    const setSelected = useCallback((items: ItemListItem[]) => {
        dispatch({ payload: items, type: 'SET_SELECTED' });
    }, []);

    const toggleExpanded = useCallback((item: ItemListItem) => {
        dispatch({ payload: item, type: 'TOGGLE_EXPANDED' });
    }, []);

    const toggleSelected = useCallback((item: ItemListItem) => {
        dispatch({ payload: item, type: 'TOGGLE_SELECTED' });
    }, []);

    const isExpanded = useCallback(
        (itemId: string) => {
            return itemGridSelectors.isExpanded(state, itemId);
        },
        [state],
    );

    const isSelected = useCallback(
        (itemId: string) => {
            return itemGridSelectors.isSelected(state, itemId);
        },
        [state],
    );

    const getExpanded = useCallback(() => {
        return itemGridSelectors.getExpanded(state);
    }, [state]);

    const getSelected = useCallback(() => {
        return itemGridSelectors.getSelected(state);
    }, [state]);

    const getExpandedIds = useCallback(() => {
        return Array.from(state.expanded);
    }, [state.expanded]);

    const getSelectedIds = useCallback(() => {
        return Array.from(state.selected);
    }, [state.selected]);

    const clearExpanded = useCallback(() => {
        dispatch({ type: 'CLEAR_EXPANDED' });
    }, []);

    const clearSelected = useCallback(() => {
        dispatch({ type: 'CLEAR_SELECTED' });
    }, []);

    const clearAll = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL' });
    }, []);

    const getVersion = useCallback(() => {
        return itemGridSelectors.getVersion(state);
    }, [state]);

    const hasExpanded = useCallback(() => {
        return itemGridSelectors.hasAnyExpanded(state);
    }, [state]);

    const hasSelected = useCallback(() => {
        return itemGridSelectors.hasAnySelected(state);
    }, [state]);

    return {
        clearAll,
        clearExpanded,
        clearSelected,
        getExpanded,
        getExpandedIds,
        getSelected,
        getSelectedIds,
        getVersion,
        hasExpanded,
        hasSelected,
        isExpanded,
        isSelected,
        setExpanded,
        setSelected,
        toggleExpanded,
        toggleSelected,
    };
};
