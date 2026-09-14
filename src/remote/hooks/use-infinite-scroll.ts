import { useCallback, useRef } from 'react';

// How many rows before the end of the currently-fetched list the last
// visible row must come within before the next page is requested — big
// enough that the page arrives before the user actually scrolls off the end
// of what's loaded.
const LOAD_MORE_THRESHOLD = 8;

interface UseInfiniteScrollOptions {
    hasMore: boolean;
    isLoading: boolean;
    loadMore: () => void;
    rowCount: number;
}

/**
 * Bridges `react-window`'s `onRowsRendered` callback to `useRemoteQuery`'s
 * pagination — requests the next page once the visible range gets close to
 * the end of what's currently loaded.
 *
 * `isLoading` guards against firing `loadMore` again for every row-render
 * notification while a page is still in flight (react-window reports the
 * visible range on every scroll tick, not just once per threshold cross).
 */
export function useInfiniteScroll({
    hasMore,
    isLoading,
    loadMore,
    rowCount,
}: UseInfiniteScrollOptions) {
    // Mirrors the latest values in a ref so the returned callback identity
    // stays stable — react-window's `List` re-subscribes to `onRowsRendered`
    // whenever the prop reference changes.
    const stateRef = useRef({ hasMore, isLoading, loadMore, rowCount });
    stateRef.current = { hasMore, isLoading, loadMore, rowCount };

    return useCallback((visibleRows: { stopIndex: number }) => {
        const {
            hasMore: canLoadMore,
            isLoading: loading,
            loadMore: fetchMore,
            rowCount: count,
        } = stateRef.current;
        if (!canLoadMore || loading) return;
        if (visibleRows.stopIndex >= count - 1 - LOAD_MORE_THRESHOLD) {
            fetchMore();
        }
    }, []);
}
