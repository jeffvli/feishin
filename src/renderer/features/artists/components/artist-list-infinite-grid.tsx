import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { useGeneralSettings } from '/@/renderer/store';
import {
    ArtistListQuery,
    ArtistListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ArtistListInfiniteGridProps extends ItemListGridComponentProps<ArtistListQuery> {}

export const ArtistListInfiniteGrid = ({
    gap = 'md',
    itemsPerPage = 100,
    itemsPerRow,
    query = {
        sortBy: ArtistListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size,
}: ArtistListInfiniteGridProps) => {
    const listCountQuery = artistsQueries.artistListCount({
        query: { ...query, limit: itemsPerPage },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getArtistList;

    const {
        dataVersion,
        getItem,
        getItemIndex,
        getLoadedItems,
        itemCount,
        loadedItems,
        onRangeChanged,
    } = useItemListInfiniteLoader({
        eventKey: ItemListKey.ARTIST,
        itemsPerPage,
        itemType: LibraryItem.ARTIST,
        listCountQuery,
        listQueryFn,
        query,
        serverId,
    });

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
        enabled: saveScrollOffset,
    });

    const rows = useGridRows(LibraryItem.ARTIST, ItemListKey.ARTIST, size);
    const { enableGridMultiSelect } = useGeneralSettings();

    return (
        <ItemGridList
            data={loadedItems}
            dataVersion={dataVersion}
            enableMultiSelect={enableGridMultiSelect}
            gap={gap}
            getItem={getItem}
            getItemIndex={getItemIndex}
            getLoadedItems={getLoadedItems}
            initialTop={{
                to: scrollOffset ?? 0,
                type: 'offset',
            }}
            itemCount={itemCount}
            itemsPerRow={itemsPerRow}
            itemType={LibraryItem.ARTIST}
            onRangeChanged={onRangeChanged}
            onScrollEnd={handleOnScrollEnd}
            rows={rows}
            size={size}
        />
    );
};
