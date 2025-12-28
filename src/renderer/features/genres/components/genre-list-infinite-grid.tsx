import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import {
    GenreListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface GenreListInfiniteGridProps extends ItemListGridComponentProps<GenreListQuery> {}

export const GenreListInfiniteGrid = ({
    gap = 'md',
    itemsPerPage = 100,
    itemsPerRow,
    query = {
        sortBy: GenreListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size,
}: GenreListInfiniteGridProps) => {
    const listCountQuery = genresQueries.listCount({
        query: { ...query },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getGenreList;

    const { data, onRangeChanged } = useItemListInfiniteLoader({
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

    const rows = useGridRows(LibraryItem.GENRE, ItemListKey.GENRE);

    return (
        <ItemGridList
            data={data}
            gap={gap}
            initialTop={{
                to: scrollOffset ?? 0,
                type: 'offset',
            }}
            itemsPerRow={itemsPerRow}
            itemType={LibraryItem.GENRE}
            onRangeChanged={onRangeChanged}
            onScrollEnd={handleOnScrollEnd}
            rows={rows}
            size={size}
        />
    );
};
