import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { Suspense, useCallback, useMemo } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
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
    PlaylistListQuery,
    PlaylistListResponse,
    PlaylistListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlaylistCarouselProps {
    containerQuery?: ReturnType<typeof useGridCarouselContainerQuery>;
    enableRefresh?: boolean;
    query?: Partial<Omit<PlaylistListQuery, 'startIndex'>>;
    title: React.ReactNode | string;
}

const BasePlaylistInfiniteCarousel = (props: PlaylistCarouselProps & { rows: DataRow[] }) => {
    const { containerQuery, enableRefresh, query: additionalQuery, title } = props;
    const {
        data: playlists,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = usePlaylistListInfinite(PlaylistListSort.UPDATED_AT, SortOrder.DESC, 20, additionalQuery);

    const controls = useDefaultItemListControls();

    const cards = useMemo(() => {
        const allItems = playlists?.pages.flatMap((page: PlaylistListResponse) => page.items) || [];

        return allItems.map((playlist: Playlist) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={playlist}
                    enableDrag={false}
                    enableExpansion={false}
                    imageFetchPriority="low"
                    itemType={LibraryItem.PLAYLIST}
                    rows={props.rows}
                    type="poster"
                    withControls
                />
            ),
            id: playlist.id,
        }));
    }, [playlists, controls, props.rows]);

    const handleNextPage = useCallback(() => {}, []);

    const handlePrevPage = useCallback(() => {}, []);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const firstPageItems = playlists?.pages[0]?.items || [];

    if (firstPageItems.length === 0) {
        return null;
    }

    return (
        <GridCarousel
            cards={cards}
            containerQuery={containerQuery}
            enableRefresh={enableRefresh}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            loadNextPage={fetchNextPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRefresh={handleRefresh}
            placeholderItemType={LibraryItem.PLAYLIST}
            placeholderRows={props.rows}
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

function usePlaylistListInfinite(
    sortBy: PlaylistListSort,
    sortOrder: SortOrder,
    itemLimit: number,
    additionalQuery?: Partial<Omit<PlaylistListQuery, 'startIndex'>>,
) {
    const serverId = useCurrentServerId();

    const defaultQueryKey = queryKeys.playlists.list(serverId, {
        sortBy,
        sortOrder,
        ...additionalQuery,
    });

    const query = useSuspenseInfiniteQuery<PlaylistListResponse>({
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.items.length < itemLimit) {
                return undefined;
            }

            const nextPageParam = Number(lastPageParam) + itemLimit;

            return String(nextPageParam);
        },
        initialPageParam: '0',
        queryFn: ({ pageParam, signal }) => {
            return api.controller.getPlaylistList({
                apiClientProps: { serverId, signal },
                query: {
                    limit: itemLimit,
                    sortBy,
                    sortOrder,
                    startIndex: Number(pageParam),
                    ...additionalQuery,
                },
            });
        },
        queryKey: defaultQueryKey,
    });

    return query;
}
