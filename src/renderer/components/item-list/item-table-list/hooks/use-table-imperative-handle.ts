import { useEffect, useImperativeHandle, useMemo } from 'react';

import { ItemListStateActions } from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemListHandle } from '/@/renderer/components/item-list/types';

interface UseTableImperativeHandleProps {
    enableHeader: boolean;
    handleRef: React.RefObject<ItemListHandle | null>;
    internalState: ItemListStateActions;
    ref?: React.Ref<ItemListHandle>;
    scrollToTableIndex: (index: number, options?: { align?: 'bottom' | 'center' | 'top' }) => void;
    scrollToTableOffset: (offset: number) => void;
}

/**
 * Hook to set up the imperative handle for ItemTableList, providing scroll methods and internal state.
 */
export const useTableImperativeHandle = ({
    enableHeader,
    handleRef,
    internalState,
    ref,
    scrollToTableIndex,
    scrollToTableOffset,
}: UseTableImperativeHandleProps) => {
    const imperativeHandle: ItemListHandle = useMemo(
        () => ({
            internalState,
            scrollToIndex: (index: number, options?: { align?: 'bottom' | 'center' | 'top' }) => {
                scrollToTableIndex(enableHeader ? index + 1 : index, options);
            },
            scrollToOffset: (offset: number) => {
                scrollToTableOffset(offset);
            },
        }),
        [enableHeader, internalState, scrollToTableIndex, scrollToTableOffset],
    );

    useImperativeHandle(ref, () => imperativeHandle);

    useEffect(() => {
        handleRef.current = imperativeHandle;
    }, [handleRef, imperativeHandle]);
};
