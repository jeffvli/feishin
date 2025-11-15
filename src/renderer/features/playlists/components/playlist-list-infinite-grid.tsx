import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import {
    LibraryItem,
    PlaylistListQuery,
    PlaylistListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlaylistListInfiniteGridProps extends ItemListGridComponentProps<PlaylistListQuery> {}

export const PlaylistListInfiniteGrid = forwardRef<any, PlaylistListInfiniteGridProps>(
    (
        {
            gap = 'md',
            itemsPerPage = 100,
            itemsPerRow,
            query = {
                sortBy: PlaylistListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
        },
        ref,
    ) => {
        const listCountQuery = playlistsQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getPlaylistList;

        const { data, onRangeChanged } = useItemListInfiniteLoader({
            eventKey: ItemListKey.PLAYLIST,
            itemsPerPage,
            itemType: LibraryItem.PLAYLIST,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        const rows = useGridRows(LibraryItem.PLAYLIST, ItemListKey.PLAYLIST);

        return (
            <ItemGridList
                data={data}
                gap={gap}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemsPerRow={itemsPerRow}
                itemType={LibraryItem.PLAYLIST}
                onRangeChanged={onRangeChanged}
                onScrollEnd={handleOnScrollEnd}
                rows={rows}
            />
        );
    },
);
