import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import {
    AlbumArtistListQuery,
    AlbumArtistListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumArtistListInfiniteGridProps
    extends ItemListGridComponentProps<AlbumArtistListQuery> {}

export const AlbumArtistListInfiniteGrid = ({
    gap = 'md',
    itemsPerPage = 100,
    itemsPerRow,
    query = {
        sortBy: AlbumArtistListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size,
}: AlbumArtistListInfiniteGridProps) => {
    const listCountQuery = artistsQueries.albumArtistListCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getAlbumArtistList;

    const { data, onRangeChanged } = useItemListInfiniteLoader({
        eventKey: ItemListKey.ALBUM_ARTIST,
        itemsPerPage,
        itemType: LibraryItem.ALBUM_ARTIST,
        listCountQuery,
        listQueryFn,
        query,
        serverId,
    });

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
        enabled: saveScrollOffset,
    });

    const rows = useGridRows(LibraryItem.ALBUM_ARTIST, ItemListKey.ALBUM_ARTIST);

    return (
        <ItemGridList
            data={data}
            gap={gap}
            initialTop={{
                to: scrollOffset ?? 0,
                type: 'offset',
            }}
            itemsPerRow={itemsPerRow}
            itemType={LibraryItem.ALBUM_ARTIST}
            onRangeChanged={onRangeChanged}
            onScrollEnd={handleOnScrollEnd}
            rows={rows}
            size={size}
        />
    );
};
