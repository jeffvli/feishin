import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumListPaginatedTableProps extends ItemListTableComponentProps<AlbumListQuery> {}

export const AlbumListPaginatedTable = forwardRef<any, AlbumListPaginatedTableProps>(
    (
        {
            autoFitColumns = false,
            columns,
            enableAlternateRowColors = false,
            enableHorizontalBorders = false,
            enableRowHoverHighlight = true,
            enableSelection = true,
            enableVerticalBorders = false,
            itemsPerPage = 100,
            query = {
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
            size = 'default',
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

        const { handleColumnResized } = useItemListColumnResize({
            itemListKey: ItemListKey.ALBUM,
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
                    autoFitColumns={autoFitColumns}
                    CellComponent={ItemTableListColumn}
                    columns={columns}
                    currentPage={currentPage}
                    data={data || []}
                    enableAlternateRowColors={enableAlternateRowColors}
                    enableHorizontalBorders={enableHorizontalBorders}
                    enableRowHoverHighlight={enableRowHoverHighlight}
                    enableSelection={enableSelection}
                    enableVerticalBorders={enableVerticalBorders}
                    initialTop={{
                        to: scrollOffset ?? 0,
                        type: 'offset',
                    }}
                    itemType={LibraryItem.ALBUM}
                    onColumnResized={handleColumnResized}
                    onScrollEnd={handleOnScrollEnd}
                    ref={ref}
                    size={size}
                />
            </ItemListWithPagination>
        );
    },
);
