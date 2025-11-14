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
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import {
    GenreListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface GenreListPaginatedGridProps extends ItemListGridComponentProps<GenreListQuery> {}

export const GenreListPaginatedGrid = forwardRef<any, GenreListPaginatedGridProps>(
    (
        {
            gap = 'md',
            itemsPerPage = 100,
            itemsPerRow,
            query = {
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
        },
        ref,
    ) => {
        const listCountQuery = genresQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getGenreList;

        const { currentPage, onChange } = useItemListPagination();

        const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
            currentPage,
            itemsPerPage,
            itemType: LibraryItem.GENRE,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        const rows = useGridRows(LibraryItem.GENRE, ItemListKey.GENRE);

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
                    itemType={LibraryItem.GENRE}
                    onScrollEnd={handleOnScrollEnd}
                    ref={ref}
                    rows={rows}
                />
            </ItemListWithPagination>
        );
    },
);
