import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import {
    AlbumArtistListQuery,
    AlbumArtistListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumArtistListPaginatedGridProps
    extends ItemListGridComponentProps<AlbumArtistListQuery> {}

export const AlbumArtistListPaginatedGrid = ({
    gap = 'md',
    itemsPerPage = 100,
    itemsPerRow,
    query = {
        sortBy: AlbumArtistListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
}: AlbumArtistListPaginatedGridProps) => {
    const listCountQuery = artistsQueries.albumArtistListCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getAlbumArtistList;

    const { currentPage, onChange } = useItemListPagination();

    const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
        currentPage,
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
        <ItemListWithPagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onChange={onChange}
            pageCount={pageCount}
            totalItemCount={totalItemCount}
        >
            <ItemGridList
                currentPage={currentPage}
                data={data || []}
                gap={gap}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemsPerRow={itemsPerRow}
                itemType={LibraryItem.ALBUM_ARTIST}
                onScrollEnd={handleOnScrollEnd}
                rows={rows}
            />
        </ItemListWithPagination>
    );
};
