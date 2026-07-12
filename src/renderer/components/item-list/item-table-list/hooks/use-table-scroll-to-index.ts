import { useCallback, useEffect, useMemo, useRef } from 'react';

import { TableItemProps } from '../item-table-list';

export type TableScrollToIndexOptions = {
    align?: 'bottom' | 'center' | 'top';
    followActiveRow?: boolean;
};

export const useTableScrollToIndex = ({
    albumGroupContentHeights,
    autoScrollToActiveRow,
    enableHeader,
    getRowHeight,
    hasAlbumGroupColumn,
    pinnedLeftColumnRef,
    pinnedRightColumnRef,
    pinnedRowCount,
    rowRef,
    scrollCellProps,
}: {
    albumGroupContentHeights: Map<string, number>;
    autoScrollToActiveRow: boolean;
    enableHeader: boolean;
    getRowHeight: (index: number, cellProps: TableItemProps) => number;
    hasAlbumGroupColumn: boolean;
    pinnedLeftColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRightColumnRef: React.RefObject<HTMLDivElement | null>;
    pinnedRowCount: number;
    rowRef: React.RefObject<HTMLDivElement | null>;
    scrollCellProps: TableItemProps;
}) => {
    const isProgrammaticScrollRef = useRef(false);
    const userInterruptedFollowRef = useRef(false);
    const pendingFollowScrollRef = useRef<null | {
        index: number;
        options?: TableScrollToIndexOptions;
    }>(null);

    const getRowHeightAtIndex = useCallback(
        (index: number) => getRowHeight(index, scrollCellProps),
        [getRowHeight, scrollCellProps],
    );

    const scrollToTableOffset = useCallback(
        (offset: number) => {
            const mainContainer = rowRef.current?.childNodes[0] as HTMLDivElement | undefined;
            const pinnedLeftContainer = pinnedLeftColumnRef.current?.childNodes[0] as
                | HTMLDivElement
                | undefined;
            const pinnedRightContainer = pinnedRightColumnRef.current?.childNodes[0] as
                | HTMLDivElement
                | undefined;

            const behavior = 'instant';

            isProgrammaticScrollRef.current = true;

            if (mainContainer) {
                mainContainer.scrollTo({ behavior, top: offset });
            }
            if (pinnedLeftContainer) {
                pinnedLeftContainer.scrollTo({ behavior, top: offset });
            }
            if (pinnedRightContainer) {
                pinnedRightContainer.scrollTo({ behavior, top: offset });
            }

            requestAnimationFrame(() => {
                isProgrammaticScrollRef.current = false;
            });
        },
        [pinnedLeftColumnRef, pinnedRightColumnRef, rowRef],
    );

    const scrollRowOffset = enableHeader ? pinnedRowCount : 0;

    const calculateScrollTopForIndex = useCallback(
        (index: number) => {
            let scrollTop = 0;

            for (let i = scrollRowOffset; i < index; i++) {
                scrollTop += getRowHeightAtIndex(i);
            }
            return scrollTop;
        },
        [getRowHeightAtIndex, scrollRowOffset],
    );

    const applyScrollToIndex = useCallback(
        (index: number, options?: TableScrollToIndexOptions) => {
            const mainContainer = rowRef.current?.childNodes[0] as HTMLDivElement | undefined;
            if (!mainContainer) return;

            const viewportHeight = mainContainer.clientHeight;
            const align = options?.align || 'top';

            let offset = calculateScrollTopForIndex(index);
            const targetRowHeight = getRowHeightAtIndex(index);

            if (align === 'center') {
                offset = offset - viewportHeight / 2 + targetRowHeight / 2;
            } else if (align === 'bottom') {
                offset = offset - viewportHeight + targetRowHeight;
            }

            offset = Math.max(0, offset);
            scrollToTableOffset(offset);
        },
        [calculateScrollTopForIndex, getRowHeightAtIndex, rowRef, scrollToTableOffset],
    );

    const scrollToTableIndex = useCallback(
        (index: number, options?: TableScrollToIndexOptions) => {
            const shouldFollow = autoScrollToActiveRow && options?.followActiveRow;
            if (shouldFollow) {
                pendingFollowScrollRef.current = { index, options };
                userInterruptedFollowRef.current = false;
            }

            applyScrollToIndex(index, options);
        },
        [applyScrollToIndex, autoScrollToActiveRow],
    );

    useEffect(() => {
        const viewport = rowRef.current?.childNodes[0] as HTMLDivElement | undefined;
        if (!viewport) return;

        const handleUserScroll = () => {
            if (isProgrammaticScrollRef.current) return;

            userInterruptedFollowRef.current = true;
            pendingFollowScrollRef.current = null;
        };

        viewport.addEventListener('scroll', handleUserScroll, { passive: true });

        return () => viewport.removeEventListener('scroll', handleUserScroll);
    }, [rowRef]);

    useEffect(() => {
        if (!autoScrollToActiveRow || !hasAlbumGroupColumn) return;

        const pending = pendingFollowScrollRef.current;
        if (!pending || userInterruptedFollowRef.current) return;
        if (albumGroupContentHeights.size === 0) return;

        const timeout = window.setTimeout(() => {
            if (userInterruptedFollowRef.current) return;

            const currentPending = pendingFollowScrollRef.current;
            if (!currentPending) return;

            applyScrollToIndex(currentPending.index, currentPending.options);
        }, 50);

        return () => window.clearTimeout(timeout);
    }, [albumGroupContentHeights, applyScrollToIndex, autoScrollToActiveRow, hasAlbumGroupColumn]);

    return useMemo(
        () => ({
            calculateScrollTopForIndex,
            getRowHeightAtIndex,
            scrollToTableIndex,
            scrollToTableOffset,
        }),
        [calculateScrollTopForIndex, getRowHeightAtIndex, scrollToTableIndex, scrollToTableOffset],
    );
};
