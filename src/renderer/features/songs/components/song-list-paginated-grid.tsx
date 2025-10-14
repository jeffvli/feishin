import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { LibraryItem, SongListQuery, SongListSort, SortOrder } from '/@/shared/types/domain-types';

interface SongListPaginatedGridProps extends ItemListGridComponentProps<SongListQuery> {}

export const SongListPaginatedGrid = forwardRef<any, SongListPaginatedGridProps>(
    (
        {
            gap = 'md',
            itemsPerPage = 100,
            query = {
                sortBy: SongListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            serverId,
        },
        ref,
    ) => {
        const listCountQuery = songsQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getSongList;

        const { currentPage, onChange } = useItemListPagination();

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
                <ItemGridList data={data || []} gap={gap} itemType={LibraryItem.SONG} ref={ref} />
            </ItemListWithPagination>
        );
    },
);
