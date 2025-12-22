import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { GridCarousel } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useCurrentServerId } from '/@/renderer/store';
import {
    Album,
    AlbumListQuery,
    AlbumListResponse,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumCarouselProps {
    excludeIds?: string[];
    query?: Partial<Omit<AlbumListQuery, 'startIndex'>>;
    rowCount?: number;
    sortBy: AlbumListSort;
    sortOrder: SortOrder;
    title: React.ReactNode | string;
}

const BaseAlbumInfiniteCarousel = (props: AlbumCarouselProps) => {
    const { excludeIds, query: additionalQuery, rowCount = 1, sortBy, sortOrder, title } = props;
    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);
    const {
        data: albums,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useAlbumListInfinite(sortBy, sortOrder, 20, additionalQuery);

    const controls = useDefaultItemListControls();

    const cards = useMemo(() => {
        // Flatten all pages and filter excluded IDs
        const allItems = albums.pages.flatMap((page: AlbumListResponse) => page.items);
        const filteredItems = excludeIds
            ? allItems.filter((album) => !excludeIds.includes(album.id))
            : allItems;

        return filteredItems.map((album: Album) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={album}
                    enableDrag
                    itemType={LibraryItem.ALBUM}
                    rows={rows}
                    type="poster"
                    withControls
                />
            ),
            id: album.id,
        }));
    }, [albums.pages, controls, excludeIds, rows]);

    const handleNextPage = useCallback(() => {}, []);

    const handlePrevPage = useCallback(() => {}, []);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const firstPageItems = excludeIds
        ? albums.pages[0]?.items.filter((album) => !excludeIds.includes(album.id)) || []
        : albums.pages[0]?.items || [];

    if (firstPageItems.length === 0) {
        return null;
    }

    return (
        <GridCarousel
            cards={cards}
            hasNextPage={hasNextPage}
            loadNextPage={fetchNextPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRefresh={handleRefresh}
            rowCount={rowCount}
            title={title}
        />
    );
};

export const AlbumInfiniteCarousel = (props: AlbumCarouselProps) => {
    return <BaseAlbumInfiniteCarousel {...props} />;
};

function useAlbumListInfinite(
    sortBy: AlbumListSort,
    sortOrder: SortOrder,
    itemLimit: number,
    additionalQuery?: Partial<Omit<AlbumListQuery, 'startIndex'>>,
) {
    const serverId = useCurrentServerId();

    const query = useSuspenseInfiniteQuery<AlbumListResponse>({
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.items.length < itemLimit) {
                return undefined;
            }

            const nextPageParam = Number(lastPageParam) + itemLimit;

            return String(nextPageParam);
        },
        initialPageParam: '0',
        queryFn: ({ pageParam, signal }) => {
            return api.controller.getAlbumList({
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
        queryKey: queryKeys.albums.infiniteList(serverId, {
            sortBy,
            sortOrder,
            ...additionalQuery,
        }),
    });

    return query;
}
