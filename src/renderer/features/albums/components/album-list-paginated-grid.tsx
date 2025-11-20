import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumListPaginatedGridProps extends ItemListGridComponentProps<AlbumListQuery> {}

export const AlbumListPaginatedGrid = forwardRef<any, AlbumListPaginatedGridProps>(
    (
        {
            gap = 'md',
            itemsPerPage = 100,
            itemsPerRow,
            query = {
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
        },
        ref,
    ) => {
        const listCountQuery = albumQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getAlbumList;

        const { currentPage, onChange } = useItemListPagination();

        const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
            currentPage,
            itemsPerPage,
            itemType: LibraryItem.ALBUM,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);

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
                    enableExpansion
                    gap={gap}
                    initialTop={{
                        to: scrollOffset ?? 0,
                        type: 'offset',
                    }}
                    itemsPerRow={itemsPerRow}
                    itemType={LibraryItem.ALBUM}
                    onScrollEnd={handleOnScrollEnd}
                    ref={ref}
                    rows={rows}
                />
            </ItemListWithPagination>
        );
    },
);
