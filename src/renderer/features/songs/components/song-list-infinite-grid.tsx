import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { LibraryItem, SongListQuery, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface SongListInfiniteGridProps extends ItemListGridComponentProps<SongListQuery> {}

export const SongListInfiniteGrid = ({
    gap = 'md',
    itemsPerPage = 100,
    itemsPerRow,
    query = {
        sortBy: SongListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size,
}: SongListInfiniteGridProps) => {
    const listCountQuery = songsQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getSongList;

    const { data, onRangeChanged } = useItemListInfiniteLoader({
        eventKey: ItemListKey.SONG,
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

    const rows = useGridRows(LibraryItem.SONG, ItemListKey.SONG);

    return (
        <ItemGridList
            data={data}
            gap={gap}
            initialTop={{
                to: scrollOffset ?? 0,
                type: 'offset',
            }}
            itemsPerRow={itemsPerRow}
            itemType={LibraryItem.SONG}
            onRangeChanged={onRangeChanged}
            onScrollEnd={handleOnScrollEnd}
            rows={rows}
            size={size}
        />
    );
};
