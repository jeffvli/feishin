import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { Suspense, useCallback, useMemo } from 'react';

import { api } from '/@/renderer/api';
import {
    GridCarousel,
    GridCarouselSkeletonFallback,
    useGridCarouselContainerQuery,
} from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { DataRow, MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useCurrentServerId } from '/@/renderer/store';
import {
    LibraryItem,
    Playlist,
    PlaylistListResponse,
    PlaylistListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlaylistCarouselProps {
    containerQuery?: ReturnType<typeof useGridCarouselContainerQuery>;
    rowCount?: number;
    title: React.ReactNode | string;
}

const BasePlaylistInfiniteCarousel = (
    props: PlaylistCarouselProps & { rows: DataRow[] },
) => {
    const { containerQuery, rowCount = 1, rows, title } = props;
    const serverId = useCurrentServerId();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useSuspenseInfiniteQuery<PlaylistListResponse>({
            getNextPageParam: (lastPage, _allPages, lastPageParam) => {
                if (lastPage.items.length < 20) return undefined;
                return String(Number(lastPageParam) + 20);
            },
            initialPageParam: '0',
            queryFn: ({ pageParam, signal }) =>
                api.controller.getPlaylistList({
                    apiClientProps: { serverId, signal },
                    query: {
                        limit: 20,
                        sortBy: PlaylistListSort.NAME,
                        sortOrder: SortOrder.ASC,
                        startIndex: Number(pageParam),
                    },
                }),
            queryKey: ['home', 'playlists', serverId],
        });

    const controls = useDefaultItemListControls();

    const cards = useMemo(() => {
        const allItems = data?.pages.flatMap((page: PlaylistListResponse) => page.items) || [];
        return allItems.map((playlist: Playlist) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={playlist}
                    enableDrag
                    enableExpansion
                    itemType={LibraryItem.PLAYLIST}
                    rows={rows}
                    type="poster"
                    withControls
                />
            ),
            id: playlist.id,
        }));
    }, [data, controls, rows]);

    const handleNextPage = useCallback(() => {}, []);
    const handlePrevPage = useCallback(() => {}, []);
    const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

    if (data?.pages[0]?.items.length === 0) return null;

    return (
        <GridCarousel
            cards={cards}
            containerQuery={containerQuery}
            enableRefresh
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            loadNextPage={fetchNextPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRefresh={handleRefresh}
            placeholderItemType={LibraryItem.PLAYLIST}
            placeholderRows={rows}
            rowCount={rowCount}
            title={title}
        />
    );
};

export const PlaylistInfiniteCarousel = (props: PlaylistCarouselProps) => {
    const rows = useGridRows(LibraryItem.PLAYLIST, ItemListKey.PLAYLIST);

    return (
        <Suspense
            fallback={
                <GridCarouselSkeletonFallback
                    containerQuery={props.containerQuery}
                    placeholderItemType={LibraryItem.PLAYLIST}
                    placeholderRows={rows}
                    title={props.title}
                />
            }
        >
            <BasePlaylistInfiniteCarousel {...props} rows={rows} />
        </Suspense>
    );
};
