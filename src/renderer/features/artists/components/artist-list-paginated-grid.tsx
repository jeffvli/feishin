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
    ArtistListQuery,
    ArtistListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ArtistListPaginatedGridProps extends ItemListGridComponentProps<ArtistListQuery> {}

export const ArtistListPaginatedGrid = ({
    gap = 'md',
    itemsPerPage = 100,
    itemsPerRow,
    query = {
        sortBy: ArtistListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size,
}: ArtistListPaginatedGridProps) => {
    const listCountQuery = artistsQueries.artistListCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getArtistList;

    const { currentPage, onChange } = useItemListPagination();

    const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
        currentPage,
        eventKey: ItemListKey.ARTIST,
        itemsPerPage,
        itemType: LibraryItem.ARTIST,
        listCountQuery,
        listQueryFn,
        query,
        serverId,
    });

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
        enabled: saveScrollOffset,
    });

    const rows = useGridRows(LibraryItem.ARTIST, ItemListKey.ARTIST);

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
                itemType={LibraryItem.ARTIST}
                onScrollEnd={handleOnScrollEnd}
                rows={rows}
                size={size}
            />
        </ItemListWithPagination>
    );
};
