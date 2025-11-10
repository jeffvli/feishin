import { useCallback, useMemo, useReducer } from 'react';

import { itemGridSelectors } from '/@/renderer/components/item-list/helpers/item-list-reducer-utils';
import { LibraryItem } from '/@/shared/types/domain-types';

export type ItemListAction =
    | { payload: ItemListStateItemWithRequiredProperties; type: 'TOGGLE_EXPANDED' }
    | { payload: ItemListStateItemWithRequiredProperties; type: 'TOGGLE_SELECTED' }
    | { payload: ItemListStateItemWithRequiredProperties[]; type: 'SET_DRAGGING' }
    | { payload: ItemListStateItemWithRequiredProperties[]; type: 'SET_EXPANDED' }
    | { payload: ItemListStateItemWithRequiredProperties[]; type: 'SET_SELECTED' }
    | { type: 'CLEAR_ALL' }
    | { type: 'CLEAR_DRAGGING' }
    | { type: 'CLEAR_EXPANDED' }
    | { type: 'CLEAR_SELECTED' };

export interface ItemListState {
    dragging: Set<string>;
    draggingItems: Map<string, unknown>;
    expanded: Set<string>;
    expandedItems: Map<string, unknown>;
    selected: Set<string>;
    selectedItems: Map<string, unknown>;
    version: number;
}

export interface ItemListStateActions {
    clearAll: () => void;
    clearDragging: () => void;
    clearExpanded: () => void;
    clearSelected: () => void;
    findItemIndex: (itemId: string) => number;
    getData: () => unknown[];
    getDragging: () => unknown[];
    getDraggingIds: () => string[];
    getExpanded: () => unknown[];
    getExpandedIds: () => string[];
    getSelected: () => unknown[];
    getSelectedIds: () => string[];
    getVersion: () => number;
    hasDragging: () => boolean;
    hasExpanded: () => boolean;
    hasSelected: () => boolean;
    isDragging: (itemId: string) => boolean;
    isExpanded: (itemId: string) => boolean;
    isSelected: (itemId: string) => boolean;
    setDragging: (items: ItemListStateItemWithRequiredProperties[]) => void;
    setExpanded: (items: ItemListStateItemWithRequiredProperties[]) => void;
    setSelected: (items: ItemListStateItemWithRequiredProperties[]) => void;
    toggleExpanded: (item: ItemListStateItemWithRequiredProperties) => void;
    toggleSelected: (item: ItemListStateItemWithRequiredProperties) => void;
}

export interface ItemListStateItem {
    _serverId: string;
    id: string;
    itemType: LibraryItem;
}

export type ItemListStateItemWithRequiredProperties = Record<string, unknown> & {
    _serverId: string;
    id: string;
    itemType: LibraryItem;
};

/**
 * Reusable reducer for item grid state management
 * Can be used in different components or contexts
 */
export const itemListReducer = (state: ItemListState, action: ItemListAction): ItemListState => {
    switch (action.type) {
        case 'CLEAR_ALL':
            return {
                ...state,
                dragging: new Set(),
                draggingItems: new Map(),
                expanded: new Set(),
                expandedItems: new Map(),
                selected: new Set(),
                selectedItems: new Map(),
                version: state.version + 1,
            };

        case 'CLEAR_DRAGGING':
            return {
                ...state,
                dragging: new Set(),
                draggingItems: new Map(),
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

        case 'SET_DRAGGING': {
            const newDragging = new Set<string>();
            const newDraggingItems = new Map<string, unknown>();

            action.payload.forEach((item) => {
                newDragging.add(item.id);
                newDraggingItems.set(item.id, item);
            });

            return {
                ...state,
                dragging: newDragging,
                draggingItems: newDraggingItems,
                version: state.version + 1,
            };
        }

        case 'SET_EXPANDED': {
            const newExpanded = new Set<string>();
            const newExpandedItems = new Map<string, unknown>();

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
            const newSelectedItems = new Map<string, unknown>();

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
            const newExpandedItems = new Map<string, unknown>();

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

export const initialItemListState: ItemListState = {
    dragging: new Set(),
    draggingItems: new Map(),
    expanded: new Set(),
    expandedItems: new Map(),
    selected: new Set(),
    selectedItems: new Map(),
    version: 0,
};

export const useItemListState = (getDataFn?: () => unknown[]): ItemListStateActions => {
    const [state, dispatch] = useReducer(itemListReducer, initialItemListState);

    const setExpanded = useCallback((items: ItemListStateItemWithRequiredProperties[]) => {
        dispatch({ payload: items, type: 'SET_EXPANDED' });
    }, []);

    const setDragging = useCallback((items: ItemListStateItemWithRequiredProperties[]) => {
        dispatch({ payload: items, type: 'SET_DRAGGING' });
    }, []);

    const setSelected = useCallback((items: ItemListStateItemWithRequiredProperties[]) => {
        dispatch({ payload: items, type: 'SET_SELECTED' });
    }, []);

    const toggleExpanded = useCallback((item: ItemListStateItemWithRequiredProperties) => {
        dispatch({ payload: item, type: 'TOGGLE_EXPANDED' });
    }, []);

    const toggleSelected = useCallback((item: ItemListStateItemWithRequiredProperties) => {
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

    const getDragging = useCallback(() => {
        return itemGridSelectors.getDragging(state);
    }, [state]);

    const getSelected = useCallback(() => {
        return itemGridSelectors.getSelected(state);
    }, [state]);

    const getDraggingIds = useCallback(() => {
        return Array.from(state.dragging);
    }, [state.dragging]);

    const getExpandedIds = useCallback(() => {
        return Array.from(state.expanded);
    }, [state.expanded]);

    const getSelectedIds = useCallback(() => {
        return Array.from(state.selected);
    }, [state.selected]);

    const clearExpanded = useCallback(() => {
        dispatch({ type: 'CLEAR_EXPANDED' });
    }, []);

    const clearDragging = useCallback(() => {
        dispatch({ type: 'CLEAR_DRAGGING' });
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

    const hasDragging = useCallback(() => {
        return itemGridSelectors.hasAnyDragging(state);
    }, [state]);

    const hasSelected = useCallback(() => {
        return itemGridSelectors.hasAnySelected(state);
    }, [state]);

    const isDragging = useCallback(
        (itemId: string) => {
            return itemGridSelectors.isDragging(state, itemId);
        },
        [state],
    );

    const getData = useCallback(() => {
        return getDataFn ? getDataFn() : [];
    }, [getDataFn]);

    const findItemIndex = useCallback(
        (itemId: string) => {
            const data = getDataFn ? getDataFn() : [];
            // Filter out null/undefined values (e.g., header row)
            const validData = data.filter((d) => d && typeof d === 'object' && 'id' in d);
            return validData.findIndex((d) => (d as any).id === itemId);
        },
        [getDataFn],
    );

    return useMemo(
        () => ({
            clearAll,
            clearDragging,
            clearExpanded,
            clearSelected,
            findItemIndex,
            getData,
            getDragging,
            getDraggingIds,
            getExpanded,
            getExpandedIds,
            getSelected,
            getSelectedIds,
            getVersion,
            hasDragging,
            hasExpanded,
            hasSelected,
            isDragging,
            isExpanded,
            isSelected,
            setDragging,
            setExpanded,
            setSelected,
            toggleExpanded,
            toggleSelected,
        }),
        [
            clearAll,
            clearDragging,
            clearExpanded,
            clearSelected,
            findItemIndex,
            getData,
            getDragging,
            getDraggingIds,
            getExpanded,
            getExpandedIds,
            getSelected,
            getSelectedIds,
            getVersion,
            hasDragging,
            hasExpanded,
            hasSelected,
            isDragging,
            isExpanded,
            isSelected,
            setDragging,
            setExpanded,
            setSelected,
            toggleExpanded,
            toggleSelected,
        ],
    );
};
