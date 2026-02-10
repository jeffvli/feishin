import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { ItemDetailList } from '/@/renderer/components/item-list/item-detail-list/item-detail-list';
import { ItemListComponentProps } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumListInfiniteDetailProps extends ItemListComponentProps<AlbumListQuery> {
    enableHeader?: boolean;
}

export const AlbumListInfiniteDetail = ({
    enableHeader = true,
    itemsPerPage = 100,
    query = {
        sortBy: AlbumListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    serverId,
}: AlbumListInfiniteDetailProps) => {
    const listCountQuery = albumQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getAlbumList;

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.ALBUM,
        tableKey: 'detail',
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.ALBUM,
        tableKey: 'detail',
    });

    const { getItem, itemCount, loadedItems, onRangeChanged } = useItemListInfiniteLoader({
        eventKey: ItemListKey.ALBUM,
        itemsPerPage,
        itemType: LibraryItem.ALBUM,
        listCountQuery,
        listQueryFn,
        query,
        serverId,
    });

    return (
        <ItemDetailList
            data={loadedItems}
            enableHeader={enableHeader}
            getItem={getItem}
            itemCount={itemCount}
            onColumnReordered={handleColumnReordered}
            onColumnResized={handleColumnResized}
            onRangeChanged={onRangeChanged}
        />
    );
};
