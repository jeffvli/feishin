import { ReactElement, useEffect } from 'react';
import { List, RowComponentProps, useListRef } from 'react-window-v2';

import { FadeIn } from '/@/remote/components/fade-in';
import { useInfiniteScroll } from '/@/remote/hooks/use-infinite-scroll';
import { Text } from '/@/shared/components/text/text';

// 56px row (list-row.module.css's min-height) + the 4px gap rows used to get
// for free from the old flex `Stack` layout — react-window's absolutely
// positioned rows don't get flexbox gap, so it's baked into the row height
// instead (see queue-row.tsx, which established this for the queue list).
const DEFAULT_ROW_HEIGHT = 60;
const DEFAULT_OVERSCAN_COUNT = 4;

interface VirtualRowListProps<RowProps extends object> {
    emptyMessage: string;
    hasMore: boolean;
    isLoading: boolean;
    loadMore: () => void;
    overscanCount?: number;
    // Identifies the current query (e.g. `${view}-${searchTerm}`) — changing
    // it scrolls back to the top, since a fresh search/view replaces `items`
    // with an unrelated, shorter list that the old scroll offset no longer
    // matches.
    resetKey: string;
    rowComponent: (props: RowComponentProps<RowProps>) => null | ReactElement;
    rowCount: number;
    rowHeight?: number;
    rowProps: RowProps;
}

export function VirtualRowList<RowProps extends object>({
    emptyMessage,
    hasMore,
    isLoading,
    loadMore,
    overscanCount = DEFAULT_OVERSCAN_COUNT,
    resetKey,
    rowComponent,
    rowCount,
    rowHeight = DEFAULT_ROW_HEIGHT,
    rowProps,
}: VirtualRowListProps<RowProps>) {
    const listRef = useListRef(null);
    const onRowsRendered = useInfiniteScroll({ hasMore, isLoading, loadMore, rowCount });

    useEffect(() => {
        if (rowCount === 0) return;
        listRef.current?.scrollToRow({ behavior: 'instant', index: 0 });
        // Only the query identity should trigger a reset — not every time
        // `rowCount` ticks up as more pages load in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    if (rowCount === 0) {
        return (
            <Text isMuted ta="center">
                {emptyMessage}
            </Text>
        );
    }

    return (
        <FadeIn style={{ flex: 1, minHeight: 0 }}>
            <List
                listRef={listRef}
                onRowsRendered={onRowsRendered}
                overscanCount={overscanCount}
                rowComponent={rowComponent}
                rowCount={rowCount}
                rowHeight={rowHeight}
                // `List`'s own `rowProps` type excludes the reserved keys
                // (`ariaAttributes`/`index`/`style`) via a mapped type that
                // isn't exported from react-window, so a generic passthrough
                // can't be checked against it structurally — our concrete
                // row prop types (TrackRowSharedProps etc.) never carry
                // those keys, so this is safe.
                rowProps={rowProps as never}
            />
        </FadeIn>
    );
}
