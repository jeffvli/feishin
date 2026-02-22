import { lazy, Suspense, useMemo } from 'react';

import { useAlbumArtistListFilters } from '/@/renderer/features/artists/hooks/use-album-artist-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { AlbumArtistListQuery } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, ListPaginationType } from '/@/shared/types/types';

const AlbumArtistListInfiniteGrid = lazy(() =>
    import('/@/renderer/features/artists/components/album-artist-list-infinite-grid').then(
        (module) => ({
            default: module.AlbumArtistListInfiniteGrid,
        }),
    ),
);

const AlbumArtistListPaginatedGrid = lazy(() =>
    import('/@/renderer/features/artists/components/album-artist-list-paginated-grid').then(
        (module) => ({
            default: module.AlbumArtistListPaginatedGrid,
        }),
    ),
);

const AlbumArtistListInfiniteTable = lazy(() =>
    import('/@/renderer/features/artists/components/album-artist-list-infinite-table').then(
        (module) => ({
            default: module.AlbumArtistListInfiniteTable,
        }),
    ),
);

const AlbumArtistListPaginatedTable = lazy(() =>
    import('/@/renderer/features/artists/components/album-artist-list-paginated-table').then(
        (module) => ({
            default: module.AlbumArtistListPaginatedTable,
        }),
    ),
);

export const AlbumArtistListContent = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(
        ItemListKey.ALBUM_ARTIST,
    );

    return (
        <Suspense fallback={<Spinner container />}>
            <AlbumArtistListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export type OverrideAlbumArtistListQuery = Omit<AlbumArtistListQuery, 'limit' | 'startIndex'>;

export const AlbumArtistListView = ({
    display,
    grid,
    itemsPerPage,
    overrideQuery,
    pagination,
    table,
}: ItemListSettings & { overrideQuery?: OverrideAlbumArtistListQuery }) => {
    const server = useCurrentServer();

    const { query } = useAlbumArtistListFilters();

    const mergedQuery = useMemo(() => {
        if (!overrideQuery) {
            return query;
        }

        return {
            ...query,
            ...overrideQuery,
            sortBy: overrideQuery.sortBy || query.sortBy,
            sortOrder: overrideQuery.sortOrder || query.sortOrder,
        };
    }, [query, overrideQuery]);

    switch (display) {
        case ListDisplayType.GRID: {
            switch (pagination) {
                case ListPaginationType.INFINITE: {
                    return (
                        <AlbumArtistListInfiniteGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={mergedQuery}
                            serverId={server.id}
                            size={grid.size}
                        />
                    );
                }
                case ListPaginationType.PAGINATED: {
                    return (
                        <AlbumArtistListPaginatedGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={mergedQuery}
                            serverId={server.id}
                            size={grid.size}
                        />
                    );
                }
                default:
                    return null;
            }
        }
        case ListDisplayType.TABLE: {
            switch (pagination) {
                case ListPaginationType.INFINITE: {
                    return (
                        <AlbumArtistListInfiniteTable
                            autoFitColumns={table.autoFitColumns}
                            columns={table.columns}
                            enableAlternateRowColors={table.enableAlternateRowColors}
                            enableHeader={table.enableHeader}
                            enableHorizontalBorders={table.enableHorizontalBorders}
                            enableRowHoverHighlight={table.enableRowHoverHighlight}
                            enableVerticalBorders={table.enableVerticalBorders}
                            itemsPerPage={itemsPerPage}
                            query={mergedQuery}
                            serverId={server.id}
                            size={table.size}
                        />
                    );
                }
                case ListPaginationType.PAGINATED: {
                    return (
                        <AlbumArtistListPaginatedTable
                            autoFitColumns={table.autoFitColumns}
                            columns={table.columns}
                            enableAlternateRowColors={table.enableAlternateRowColors}
                            enableHeader={table.enableHeader}
                            enableHorizontalBorders={table.enableHorizontalBorders}
                            enableRowHoverHighlight={table.enableRowHoverHighlight}
                            enableVerticalBorders={table.enableVerticalBorders}
                            itemsPerPage={itemsPerPage}
                            query={mergedQuery}
                            serverId={server.id}
                            size={table.size}
                        />
                    );
                }
                default:
                    return null;
            }
        }
    }

    return null;
};
