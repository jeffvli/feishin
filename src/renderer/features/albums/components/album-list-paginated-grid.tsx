import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import {
    PaginatedListProps,
    useItemListPaginatedLoader,
} from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface AlbumListPaginatedGridProps extends PaginatedListProps<AlbumListQuery> {}

export const AlbumListPaginatedGrid = forwardRef<any, AlbumListPaginatedGridProps>(
    (
        {
            initialPage,
            itemsPerPage = 100,
            query = {
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            serverId,
        },
        ref,
    ) => {
        const listCountQuery = albumQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getAlbumList;

        const { currentPage, onChange } = useItemListPagination({ initialPage });

        const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
            currentPage,
            itemsPerPage,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        return (
            <ItemListWithPagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onChange={onChange}
                pageCount={pageCount}
                totalItemCount={totalItemCount}
            >
                <ItemGridList data={data || []} itemType={LibraryItem.ALBUM} ref={ref} />
            </ItemListWithPagination>
        );
    },
);
