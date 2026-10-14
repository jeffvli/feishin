import { useEffect, useImperativeHandle, useMemo } from 'react';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemListHandle } from '/@/renderer/components/item-list/types';

interface UseTableImperativeHandleProps {
    autoScrollToActiveRow: boolean;
    handleRef: React.RefObject<ItemListHandle | null>;
    internalState: ItemListStateActions;
    mapDataIndexToRowIndex: (dataIndex: number) => number;
    ref?: React.Ref<ItemListHandle>;
    scrollToTableIndex: (
        index: number,
        options?: { align?: 'bottom' | 'center' | 'top'; followActiveRow?: boolean },
    ) => void;
    scrollToTableOffset: (offset: number) => void;
}

/**
 * Hook to set up the imperative handle for ItemTableList, providing scroll methods and internal state.
 */
export const useTableImperativeHandle = ({
    autoScrollToActiveRow,
    handleRef,
    internalState,
    mapDataIndexToRowIndex,
    ref,
    scrollToTableIndex,
    scrollToTableOffset,
}: UseTableImperativeHandleProps) => {
    const imperativeHandle: ItemListHandle = useMemo(
        () => ({
            internalState,
            scrollToIndex: (index: number, options?: { align?: 'bottom' | 'center' | 'top' }) => {
                scrollToTableIndex(mapDataIndexToRowIndex(index), {
                    ...options,
                    followActiveRow: autoScrollToActiveRow,
                });
            },
            scrollToOffset: (offset: number) => {
                scrollToTableOffset(offset);
            },
        }),
        [
            autoScrollToActiveRow,
            internalState,
            mapDataIndexToRowIndex,
            scrollToTableIndex,
            scrollToTableOffset,
        ],
    );

    useImperativeHandle(ref, () => imperativeHandle);

    useEffect(() => {
        handleRef.current = imperativeHandle;
    }, [handleRef, imperativeHandle]);
};
