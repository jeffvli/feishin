import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import {
    GenreListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface GenreListPaginatedTableProps extends ItemListTableComponentProps<GenreListQuery> {}

export const GenreListPaginatedTable = ({
    autoFitColumns = false,
    columns,
    enableAlternateRowColors = false,
    enableHorizontalBorders = false,
    enableRowHoverHighlight = true,
    enableSelection = true,
    enableVerticalBorders = false,
    itemsPerPage = 100,
    query = {
        sortBy: GenreListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size = 'default',
}: GenreListPaginatedTableProps) => {
    const listCountQuery = genresQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getGenreList;

    const { currentPage, onChange } = useItemListPagination();

    const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
        currentPage,
        eventKey: ItemListKey.GENRE,
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

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.GENRE,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.GENRE,
    });

    const startRowIndex = currentPage * itemsPerPage;

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
                data={data || []}
                enableAlternateRowColors={enableAlternateRowColors}
                enableExpansion={false}
                enableHorizontalBorders={enableHorizontalBorders}
                enableRowHoverHighlight={enableRowHoverHighlight}
                enableSelection={enableSelection}
                enableVerticalBorders={enableVerticalBorders}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.GENRE}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                onScrollEnd={handleOnScrollEnd}
                size={size}
                startRowIndex={startRowIndex}
            />
        </ItemListWithPagination>
    );
};
