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
    AlbumArtist,
    AlbumArtistListQuery,
    AlbumArtistListResponse,
    AlbumArtistListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumArtistCarouselProps {
    excludeIds?: string[];
    query?: Partial<Omit<AlbumArtistListQuery, 'startIndex'>>;
    rowCount?: number;
    sortBy: AlbumArtistListSort;
    sortOrder: SortOrder;
    title: React.ReactNode | string;
}

export const BaseAlbumArtistInfiniteCarousel = (props: AlbumArtistCarouselProps) => {
    const { excludeIds, query: additionalQuery, rowCount = 1, sortBy, sortOrder, title } = props;
    const rows = useGridRows(LibraryItem.ALBUM_ARTIST, ItemListKey.ALBUM_ARTIST);
    const {
        data: albumArtists,
        fetchNextPage,
        hasNextPage,
    } = useAlbumArtistListInfinite(sortBy, sortOrder, 20, additionalQuery);

    const controls = useDefaultItemListControls();

    const cards = useMemo(() => {
        // Flatten all pages and filter excluded IDs
        const allItems = albumArtists.pages.flatMap((page: AlbumArtistListResponse) => page.items);
        const filteredItems = excludeIds
            ? allItems.filter((albumArtist) => !excludeIds.includes(albumArtist.id))
            : allItems;

        return filteredItems.map((albumArtist: AlbumArtist) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={albumArtist}
                    enableDrag
                    itemType={LibraryItem.ALBUM_ARTIST}
                    rows={rows}
                    type="poster"
                    withControls
                />
            ),
            id: albumArtist.id,
        }));
    }, [albumArtists.pages, controls, excludeIds, rows]);

    const handleNextPage = useCallback(() => {}, []);

    const handlePrevPage = useCallback(() => {}, []);

    const firstPageItems = excludeIds
        ? albumArtists.pages[0]?.items.filter(
              (albumArtist) => !excludeIds.includes(albumArtist.id),
          ) || []
        : albumArtists.pages[0]?.items || [];

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
            rowCount={rowCount}
            title={title}
        />
    );
};

export const AlbumArtistInfiniteCarousel = (props: AlbumArtistCarouselProps) => {
    return <BaseAlbumArtistInfiniteCarousel {...props} />;
};

function useAlbumArtistListInfinite(
    sortBy: AlbumArtistListSort,
    sortOrder: SortOrder,
    itemLimit: number,
    additionalQuery?: Partial<Omit<AlbumArtistListQuery, 'startIndex'>>,
) {
    const serverId = useCurrentServerId();

    const query = useSuspenseInfiniteQuery<AlbumArtistListResponse>({
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.items.length < itemLimit) {
                return undefined;
            }

            const nextPageParam = Number(lastPageParam) + itemLimit;

            return String(nextPageParam);
        },
        initialPageParam: '0',
        queryFn: ({ pageParam, signal }) => {
            return api.controller.getAlbumArtistList({
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
        queryKey: queryKeys.albumArtists.list(serverId, {
            sortBy,
            sortOrder,
            ...additionalQuery,
        }),
    });

    return query;
}
