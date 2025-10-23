import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { LibraryItem, SongListQuery, SongListSort, SortOrder } from '/@/shared/types/domain-types';

interface SongListPaginatedTableProps extends ItemListTableComponentProps<SongListQuery> {}

export const SongListPaginatedTable = forwardRef<any, SongListPaginatedTableProps>(
    (
        {
            columns,
            enableAlternateRowColors = false,
            enableHorizontalBorders = false,
            enableRowHoverHighlight = true,
            enableVerticalBorders = false,
            itemsPerPage = 100,
            query = {
                sortBy: SongListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
            size = 'default',
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
            itemType: LibraryItem.SONG,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        return (
            <ItemListWithPagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onChange={onChange}
                pageCount={pageCount}
                totalItemCount={totalItemCount}
            >
                <ItemTableList
                    CellComponent={ItemTableListColumn}
                    columns={columns}
                    data={data || []}
                    enableAlternateRowColors={enableAlternateRowColors}
                    enableHorizontalBorders={enableHorizontalBorders}
                    enableRowHoverHighlight={enableRowHoverHighlight}
                    enableVerticalBorders={enableVerticalBorders}
                    initialTop={{
                        to: scrollOffset ?? 0,
                        type: 'offset',
                    }}
                    itemType={LibraryItem.SONG}
                    onScrollEnd={handleOnScrollEnd}
                    ref={ref}
                    size={size}
                />
            </ItemListWithPagination>
        );
    },
);
