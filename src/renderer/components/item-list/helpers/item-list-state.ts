import { useCallback, useMemo, useReducer } from 'react';

import { itemListSelectors } from '/@/renderer/components/item-list/helpers/item-list-reducer-utils';
import { LibraryItem } from '/@/shared/types/domain-types';

const sortByDataOrder = <T>(
    items: T[],
    data: unknown[],
    extractRowId: (item: unknown) => string | undefined,
    isIdArray: boolean,
): T[] => {
    const rowIdToIndex = new Map<string, number>();

    // Create a map of rowId to index in the data array
    data.forEach((item, index) => {
        if (item && typeof item === 'object') {
            const itemRowId = extractRowId(item);
            if (itemRowId) {
                rowIdToIndex.set(itemRowId, index);
            }
        }
    });

    // Sort items by their index in the data array (create new array to avoid mutation)
    return [...items].sort((a, b) => {
        const rowIdA = isIdArray ? (a as string) : extractRowId(a as unknown);
        const rowIdB = isIdArray ? (b as string) : extractRowId(b as unknown);
        const indexA = rowIdA ? (rowIdToIndex.get(rowIdA) ?? Infinity) : Infinity;
        const indexB = rowIdB ? (rowIdToIndex.get(rowIdB) ?? Infinity) : Infinity;
        return indexA - indexB;
    });
};

export type ItemListAction =
    | {
          extractRowId: (item: unknown) => string | undefined;
          payload: ItemListStateItemWithRequiredProperties;
          type: 'TOGGLE_EXPANDED';
      }
    | {
          extractRowId: (item: unknown) => string | undefined;
          payload: ItemListStateItemWithRequiredProperties;
          type: 'TOGGLE_SELECTED';
      }
    | {
          extractRowId: (item: unknown) => string | undefined;
          payload: ItemListStateItemWithRequiredProperties[];
          type: 'SET_DRAGGING';
      }
    | {
          extractRowId: (item: unknown) => string | undefined;
          payload: ItemListStateItemWithRequiredProperties[];
          type: 'SET_EXPANDED';
      }
    | {
          extractRowId: (item: unknown) => string | undefined;
          payload: ItemListStateItemWithRequiredProperties[];
          type: 'SET_SELECTED';
      }
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
    extractRowId: (item: unknown) => string | undefined;
    findItemIndex: (rowId: string) => number;
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
    isDragging: (rowId: string) => boolean;
    isExpanded: (rowId: string) => boolean;
    isSelected: (rowId: string) => boolean;
    setDragging: (items: ItemListStateItemWithRequiredProperties[]) => void;
    setExpanded: (items: ItemListStateItemWithRequiredProperties[]) => void;
    setSelected: (items: ItemListStateItemWithRequiredProperties[]) => void;
    toggleExpanded: (item: ItemListStateItemWithRequiredProperties) => void;
    toggleSelected: (item: ItemListStateItemWithRequiredProperties) => void;
}

export interface ItemListStateItem {
    _itemType: LibraryItem;
    _serverId: string;
    id: string;
}

export type ItemListStateItemWithRequiredProperties = Record<string, unknown> & {
    _itemType: LibraryItem;
    _serverId: string;
    id: string;
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
                const rowId = action.extractRowId(item);
                if (rowId) {
                    newDragging.add(rowId);
                    newDraggingItems.set(rowId, item);
                }
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
                const rowId = action.extractRowId(firstItem);
                if (rowId) {
                    newExpanded.add(rowId);
                    newExpandedItems.set(rowId, firstItem);
                }
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
                const rowId = action.extractRowId(item);
                if (rowId) {
                    newSelected.add(rowId);
                    newSelectedItems.set(rowId, item);
                }
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

            const rowId = action.extractRowId(action.payload);
            if (!rowId) {
                return state;
            }

            // If the item is already expanded, collapse it
            if (state.expanded.has(rowId)) {
                // Item is expanded, so collapse it (leave sets empty)
            } else {
                // Item is not expanded, so expand it (clear others first for single expansion)
                newExpanded.add(rowId);
                newExpandedItems.set(rowId, action.payload);
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

            const rowId = action.extractRowId(action.payload);
            if (!rowId) {
                return state;
            }

            if (newSelected.has(rowId)) {
                newSelected.delete(rowId);
                newSelectedItems.delete(rowId);
            } else {
                newSelected.add(rowId);
                newSelectedItems.set(rowId, action.payload);
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

export const useItemListState = (
    getDataFn?: () => unknown[],
    extractRowId?: (item: unknown) => string | undefined,
): ItemListStateActions => {
    const [state, dispatch] = useReducer(itemListReducer, initialItemListState);

    const extractRowIdFn = useCallback(
        (item: unknown) => {
            if (extractRowId) {
                return extractRowId(item);
            }
            // Fallback to id if extractRowId is not provided
            if (item && typeof item === 'object' && 'id' in item) {
                return (item as any).id;
            }
            return undefined;
        },
        [extractRowId],
    );

    const setExpanded = useCallback(
        (items: ItemListStateItemWithRequiredProperties[]) => {
            dispatch({
                extractRowId: extractRowIdFn,
                payload: items,
                type: 'SET_EXPANDED',
            });
        },
        [extractRowIdFn],
    );

    const setDragging = useCallback(
        (items: ItemListStateItemWithRequiredProperties[]) => {
            dispatch({
                extractRowId: extractRowIdFn,
                payload: items,
                type: 'SET_DRAGGING',
            });
        },
        [extractRowIdFn],
    );

    const setSelected = useCallback(
        (items: ItemListStateItemWithRequiredProperties[]) => {
            dispatch({
                extractRowId: extractRowIdFn,
                payload: items,
                type: 'SET_SELECTED',
            });
        },
        [extractRowIdFn],
    );

    const toggleExpanded = useCallback(
        (item: ItemListStateItemWithRequiredProperties) => {
            dispatch({
                extractRowId: extractRowIdFn,
                payload: item,
                type: 'TOGGLE_EXPANDED',
            });
        },
        [extractRowIdFn],
    );

    const toggleSelected = useCallback(
        (item: ItemListStateItemWithRequiredProperties) => {
            dispatch({
                extractRowId: extractRowIdFn,
                payload: item,
                type: 'TOGGLE_SELECTED',
            });
        },
        [extractRowIdFn],
    );

    const isExpanded = useCallback(
        (rowId: string) => {
            return itemListSelectors.isExpanded(state, rowId);
        },
        [state],
    );

    const isSelected = useCallback(
        (rowId: string) => {
            return itemListSelectors.isSelected(state, rowId);
        },
        [state],
    );

    const getExpanded = useCallback(() => {
        return itemListSelectors.getExpanded(state);
    }, [state]);

    const getDragging = useCallback(() => {
        return itemListSelectors.getDragging(state);
    }, [state]);

    const getSelected = useCallback(() => {
        const selectedItems = itemListSelectors.getSelected(state);
        const data = getDataFn ? getDataFn() : [];
        return sortByDataOrder(selectedItems, data, extractRowIdFn, false);
    }, [state, getDataFn, extractRowIdFn]);

    const getDraggingIds = useCallback(() => {
        return Array.from(state.dragging);
    }, [state.dragging]);

    const getExpandedIds = useCallback(() => {
        return Array.from(state.expanded);
    }, [state.expanded]);

    const getSelectedIds = useCallback(() => {
        const selectedIds = Array.from(state.selected);
        const data = getDataFn ? getDataFn() : [];
        return sortByDataOrder(selectedIds, data, extractRowIdFn, true);
    }, [state.selected, getDataFn, extractRowIdFn]);

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
        return itemListSelectors.getVersion(state);
    }, [state]);

    const hasExpanded = useCallback(() => {
        return itemListSelectors.hasAnyExpanded(state);
    }, [state]);

    const hasDragging = useCallback(() => {
        return itemListSelectors.hasAnyDragging(state);
    }, [state]);

    const hasSelected = useCallback(() => {
        return itemListSelectors.hasAnySelected(state);
    }, [state]);

    const isDragging = useCallback(
        (rowId: string) => {
            return itemListSelectors.isDragging(state, rowId);
        },
        [state],
    );

    const getData = useCallback(() => {
        return getDataFn ? getDataFn() : [];
    }, [getDataFn]);

    const findItemIndex = useCallback(
        (rowId: string) => {
            const data = getDataFn ? getDataFn() : [];
            // Filter out null/undefined values (e.g., header row)
            const validData = data.filter((d) => d && typeof d === 'object');
            if (!extractRowId) {
                // Fallback to id if extractRowId is not provided
                return validData.findIndex((d) => (d as any).id === rowId);
            }
            return validData.findIndex((d) => extractRowId(d) === rowId);
        },
        [getDataFn, extractRowId],
    );

    return useMemo(
        () => ({
            clearAll,
            clearDragging,
            clearExpanded,
            clearSelected,
            extractRowId: extractRowIdFn,
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
            extractRowIdFn,
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
