import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface AlbumListInfiniteTableProps extends ItemListTableComponentProps<AlbumListQuery> {}

export const AlbumListInfiniteTable = forwardRef<any, AlbumListInfiniteTableProps>(
    (
        {
            columns,
            enableAlternateRowColors = false,
            enableHorizontalBorders = false,
            enableRowHoverHighlight = true,
            enableSelection = true,
            enableVerticalBorders = false,
            itemsPerPage = 100,
            query = {
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
            size = 'default',
        },
        ref,
    ) => {
        const listCountQuery = albumQueries.listCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getAlbumList;

        const { data, onRangeChanged } = useItemListInfiniteLoader({
            eventKey: ItemListKey.ALBUM,
            itemsPerPage,
            itemType: LibraryItem.ALBUM,
            listCountQuery,
            listQueryFn,
            query,
            serverId,
        });

        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        return (
            <ItemTableList
                CellComponent={ItemTableListColumn}
                columns={columns}
                data={data}
                enableAlternateRowColors={enableAlternateRowColors}
                enableHorizontalBorders={enableHorizontalBorders}
                enableRowHoverHighlight={enableRowHoverHighlight}
                enableSelection={enableSelection}
                enableVerticalBorders={enableVerticalBorders}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.ALBUM}
                onRangeChanged={onRangeChanged}
                onScrollEnd={handleOnScrollEnd}
                ref={ref}
                size={size}
            />
        );
    },
);
