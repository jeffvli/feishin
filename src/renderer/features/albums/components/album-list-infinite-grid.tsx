import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import {
    InfiniteListProps,
    useItemListInfiniteLoader,
} from '/@/renderer/components/item-list/helpers/item-list-loader';
import { ItemGrid } from '/@/renderer/components/item-list/item-grid/item-grid';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface AlbumListInfiniteGridProps extends InfiniteListProps<AlbumListQuery> {}

export const AlbumListInfiniteGrid = forwardRef<any, AlbumListInfiniteGridProps>(
    (
        {
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

        const { data, onRangeChanged } = useItemListInfiniteLoader({
            itemsPerPage: 100,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        return (
            <ItemGrid
                data={data || []}
                itemType={LibraryItem.ALBUM}
                onRangeChanged={onRangeChanged}
                ref={ref}
            />
        );
    },
);
