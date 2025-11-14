import { UseSuspenseQueryOptions } from '@tanstack/react-query';
import { forwardRef } from 'react';

import { api } from '/@/renderer/api';
import { useItemListInfiniteLoader } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import {
    ArtistListQuery,
    ArtistListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ArtistListInfiniteTableProps extends ItemListTableComponentProps<ArtistListQuery> {}

export const ArtistListInfiniteTable = forwardRef<any, ArtistListInfiniteTableProps>(
    (
        {
            autoFitColumns = false,
            columns,
            enableAlternateRowColors = false,
            enableHorizontalBorders = false,
            enableRowHoverHighlight = true,
            enableSelection = true,
            enableVerticalBorders = false,
            itemsPerPage = 100,
            query = {
                sortBy: ArtistListSort.NAME,
                sortOrder: SortOrder.ASC,
            },
            saveScrollOffset = true,
            serverId,
            size = 'default',
        },
        ref,
    ) => {
        const listCountQuery = artistsQueries.artistListCount({
            query: { ...query },
            serverId: serverId,
        }) as UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;

        const listQueryFn = api.controller.getArtistList;

        const { data, onRangeChanged } = useItemListInfiniteLoader({
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

        const { handleColumnResized } = useItemListColumnResize({
            itemListKey: ItemListKey.ARTIST,
        });

        return (
            <ItemTableList
                autoFitColumns={autoFitColumns}
                CellComponent={ItemTableListColumn}
                columns={columns}
                data={data}
                enableAlternateRowColors={enableAlternateRowColors}
                enableExpansion={false}
                enableHorizontalBorders={enableHorizontalBorders}
                enableRowHoverHighlight={enableRowHoverHighlight}
                enableSelection={enableSelection}
                enableVerticalBorders={enableVerticalBorders}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.ARTIST}
                onColumnResized={handleColumnResized}
                onRangeChanged={onRangeChanged}
                onScrollEnd={handleOnScrollEnd}
                ref={ref}
                size={size}
            />
        );
    },
);
