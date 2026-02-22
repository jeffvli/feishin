import { UseSuspenseQueryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { usePlayerSong } from '/@/renderer/store';
import { LibraryItem, SongListQuery, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface SongListInfiniteTableProps extends ItemListTableComponentProps<SongListQuery> {}

export const SongListInfiniteTable = ({
    autoFitColumns = false,
    columns,
    enableAlternateRowColors = false,
    enableHeader = true,
    enableHorizontalBorders = false,
    enableRowHoverHighlight = true,
    enableSelection = true,
    enableVerticalBorders = false,
    itemsPerPage = 100,
    query = {
        sortBy: SongListSort.NAME,
        sortOrder: SortOrder.ASC,
    },
    saveScrollOffset = true,
    serverId,
    size = 'default',
}: SongListInfiniteTableProps) => {
    const listCountQuery = songsQueries.listCount({
        query: { ...query, limit: itemsPerPage },
        serverId: serverId,
    }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

    const listQueryFn = api.controller.getSongList;
    const { pageKey } = useListContext();

    const { getItem, getItemIndex, itemCount, loadedItems, onRangeChanged } =
        useItemListInfiniteLoader({
            eventKey: pageKey || ItemListKey.SONG,
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

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.SONG,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.SONG,
    });

    const currentSong = usePlayerSong();

    return (
        <ItemTableList
            activeRowId={currentSong?.id}
            autoFitColumns={autoFitColumns}
            CellComponent={ItemTableListColumn}
            columns={columns}
            data={loadedItems}
            enableAlternateRowColors={enableAlternateRowColors}
            enableExpansion={false}
            enableHeader={enableHeader}
            enableHorizontalBorders={enableHorizontalBorders}
            enableRowHoverHighlight={enableRowHoverHighlight}
            enableSelection={enableSelection}
            enableVerticalBorders={enableVerticalBorders}
            getItem={getItem}
            getItemIndex={getItemIndex}
            initialTop={{
                to: scrollOffset ?? 0,
                type: 'offset',
            }}
            itemCount={itemCount}
            itemType={LibraryItem.SONG}
            onColumnReordered={handleColumnReordered}
            onColumnResized={handleColumnResized}
            onRangeChanged={onRangeChanged}
            onScrollEnd={handleOnScrollEnd}
            size={size}
        />
    );
};
