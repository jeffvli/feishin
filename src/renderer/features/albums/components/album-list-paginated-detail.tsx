import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListPaginatedLoader } from '/@/renderer/components/item-list/helpers/item-list-paginated-loader';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { ItemDetailList } from '/@/renderer/components/item-list/item-detail-list/item-detail-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemListComponentProps } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumListPaginatedDetailProps extends ItemListComponentProps<AlbumListQuery> {
    enableHeader?: boolean;
}

export const AlbumListPaginatedDetail = ({
    enableHeader = true,
    itemsPerPage = 100,
    query = {
        sortBy: AlbumListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    serverId,
}: AlbumListPaginatedDetailProps) => {
    const listCountQuery = albumQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getAlbumList;
    const { pageKey } = useListContext();

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.ALBUM,
        tableKey: 'detail',
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.ALBUM,
        tableKey: 'detail',
    });

    const { currentPage, onChange } = useItemListPagination();

    const { data, pageCount, totalItemCount } = useItemListPaginatedLoader({
        currentPage,
        eventKey: pageKey || ItemListKey.ALBUM,
        itemsPerPage,
        itemType: LibraryItem.ALBUM,
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
            <ItemDetailList
                currentPage={currentPage}
                enableHeader={enableHeader}
                items={data || []}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
            />
        </ItemListWithPagination>
    );
};
