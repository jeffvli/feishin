import { useCallback } from 'react';

import {
    ItemListStateActions,
    ItemListStateItemWithRequiredProperties,
} from '/@/renderer/components/item-list/helpers/item-list-state';

interface UseTableKeyboardNavigationProps {
    calculateScrollTopForIndex: (index: number) => number;
    data: unknown[];
    enableHeader: boolean;
    enableSelection: boolean;
    extractRowId: (item: unknown) => string | undefined;
    getItem?: (index: number) => undefined | unknown;
    getItemIndex?: (rowId: string) => number | undefined;
    getRowHeightAtIndex: (index: number) => number;
    getStateItem: (item: any) => ItemListStateItemWithRequiredProperties | null;
    hasRequiredStateItemProperties: (
        item: unknown,
    ) => item is ItemListStateItemWithRequiredProperties;
    internalState: ItemListStateActions;
    itemCount?: number;
    pinnedRightColumnCount: number;
    pinnedRightColumnRef: React.RefObject<HTMLDivElement | null>;
    rowRef: React.RefObject<HTMLDivElement | null>;
    scrollToTableIndex: (index: number, options?: { align?: 'bottom' | 'center' | 'top' }) => void;
}

/**
 * Hook to handle keyboard navigation (ArrowUp/ArrowDown) for table row selection and scrolling.
 */
export const useTableKeyboardNavigation = ({
    calculateScrollTopForIndex,
    data,
    enableHeader,
    enableSelection,
    extractRowId,
    getItem,
    getItemIndex,
    getRowHeightAtIndex,
    getStateItem,
    hasRequiredStateItemProperties,
    internalState,
    itemCount,
    pinnedRightColumnCount,
    pinnedRightColumnRef,
    rowRef,
    scrollToTableIndex,
}: UseTableKeyboardNavigationProps) => {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!enableSelection) return;
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            e.stopPropagation();

            const selected = internalState.getSelected();
            const validSelected = selected.filter(hasRequiredStateItemProperties);
            let currentIndex = -1;
            const totalCount = itemCount ?? data.length;

            if (validSelected.length > 0) {
                const lastSelected = validSelected[validSelected.length - 1];
                const rowId = extractRowId(lastSelected);
                if (rowId) {
                    currentIndex =
                        getItemIndex?.(rowId) ?? data.findIndex((d) => extractRowId(d) === rowId);
                }
            }

            let newIndex = 0;
            if (currentIndex !== -1) {
                newIndex =
                    e.key === 'ArrowDown'
                        ? Math.min(currentIndex + 1, totalCount - 1)
                        : Math.max(currentIndex - 1, 0);
            }

            const newItem: any = getItem ? getItem(newIndex) : data[newIndex];
            if (!newItem) return;

            const newItemListItem = getStateItem(newItem);
            if (newItemListItem && extractRowId(newItemListItem)) {
                internalState.setSelected([newItemListItem]);
            }

            // Check if we need to scroll by determining if the item is at the edge of the viewport
            const gridIndex = enableHeader ? newIndex + 1 : newIndex;

            const mainContainer = rowRef.current?.childNodes[0] as HTMLDivElement | undefined;
            const pinnedRightContainer = pinnedRightColumnRef.current?.childNodes[0] as
                | HTMLDivElement
                | undefined;

            // Use right pinned column scroll position if right-pinned columns exist
            const scrollContainer =
                pinnedRightColumnCount > 0 && pinnedRightContainer
                    ? pinnedRightContainer
                    : mainContainer;

            if (scrollContainer) {
                const viewportTop = scrollContainer.scrollTop;
                const viewportHeight = scrollContainer.clientHeight;
                const viewportBottom = viewportTop + viewportHeight;

                const rowTop = calculateScrollTopForIndex(gridIndex);
                const calculatedRowHeight = getRowHeightAtIndex(gridIndex);
                const rowBottom = rowTop + calculatedRowHeight;

                // Check if row is fully visible within viewport
                const isFullyVisible = rowTop >= viewportTop && rowBottom <= viewportBottom;

                // Check if row is at the edge (top or bottom of viewport)
                const isAtTopEdge = rowTop < viewportTop;
                const isAtBottomEdge = rowBottom >= viewportBottom;

                // Only scroll if the item is not fully visible or at the edge
                if (!isFullyVisible || isAtTopEdge || isAtBottomEdge) {
                    // Determine alignment based on direction
                    const align: 'bottom' | 'top' =
                        e.key === 'ArrowDown' && isAtBottomEdge
                            ? 'bottom'
                            : e.key === 'ArrowUp' && isAtTopEdge
                              ? 'top'
                              : isAtBottomEdge
                                ? 'bottom'
                                : isAtTopEdge
                                  ? 'top'
                                  : 'top';

                    scrollToTableIndex(gridIndex, { align });
                }
            }
        },
        [
            calculateScrollTopForIndex,
            data,
            getItem,
            getItemIndex,
            enableHeader,
            enableSelection,
            extractRowId,
            getRowHeightAtIndex,
            getStateItem,
            hasRequiredStateItemProperties,
            internalState,
            itemCount,
            pinnedRightColumnCount,
            pinnedRightColumnRef,
            rowRef,
            scrollToTableIndex,
        ],
    );

    return { handleKeyDown };
};
