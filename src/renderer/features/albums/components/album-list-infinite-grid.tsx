import { UseQueryOptions, UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import {
    InfiniteListProps,
    useItemListInfiniteLoader,
} from '/@/renderer/components/item-list/helpers/item-list-loader';
import { ItemGrid } from '/@/renderer/components/item-list/item-grid/item-grid';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumListQuery, AlbumListResponse, LibraryItem } from '/@/shared/types/domain-types';

interface AlbumListInfiniteGridProps extends InfiniteListProps<AlbumListQuery> {}

export const AlbumListInfiniteGrid = forwardRef<any, AlbumListInfiniteGridProps>(
    ({ query, serverId }, ref) => {
        const listCountQuery = albumQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQuery = albumQueries.list({
            query: { ...query, startIndex: 0 },
            serverId: serverId,
        }) as UseQueryOptions<AlbumListResponse, Error, AlbumListResponse, readonly unknown[]>;

        const { data, onRangeChanged } = useItemListInfiniteLoader({
            itemsPerPage: 100,
            itemType: LibraryItem.ALBUM,
            listCountQuery,
            listQuery,
            params: query,
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
