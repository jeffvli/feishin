import { lazy, Suspense } from 'react';

import { usePlaylistListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ItemListKey, ListDisplayType, ListPaginationType } from '/@/shared/types/types';

const PlaylistListInfiniteGrid = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-list-infinite-grid').then((module) => ({
        default: module.PlaylistListInfiniteGrid,
    })),
);

const PlaylistListPaginatedGrid = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-list-paginated-grid').then((module) => ({
        default: module.PlaylistListPaginatedGrid,
    })),
);

const PlaylistListInfiniteTable = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-list-infinite-table').then((module) => ({
        default: module.PlaylistListInfiniteTable,
    })),
);

const PlaylistListPaginatedTable = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-list-paginated-table').then((module) => ({
        default: module.PlaylistListPaginatedTable,
    })),
);

export const PlaylistListContent = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.PLAYLIST);

    return (
        <Suspense fallback={<Spinner container />}>
            <PlaylistListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export const PlaylistListView = ({
    display,
    grid,
    itemsPerPage,
    pagination,
    table,
}: ItemListSettings) => {
    const server = useCurrentServer();

    const { query } = usePlaylistListFilters();

    switch (display) {
        case ListDisplayType.GRID: {
            switch (pagination) {
                case ListPaginationType.INFINITE: {
                    return (
                        <PlaylistListInfiniteGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={query}
                            serverId={server.id}
                        />
                    );
                }
                case ListPaginationType.PAGINATED: {
                    return (
                        <PlaylistListPaginatedGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={query}
                            serverId={server.id}
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
                        <PlaylistListInfiniteTable
                            autoFitColumns={table.autoFitColumns}
                            columns={table.columns}
                            enableAlternateRowColors={table.enableAlternateRowColors}
                            enableHorizontalBorders={table.enableHorizontalBorders}
                            enableRowHoverHighlight={table.enableRowHoverHighlight}
                            enableVerticalBorders={table.enableVerticalBorders}
                            itemsPerPage={itemsPerPage}
                            query={query}
                            serverId={server.id}
                            size={table.size}
                        />
                    );
                }
                case ListPaginationType.PAGINATED: {
                    return (
                        <PlaylistListPaginatedTable
                            autoFitColumns={table.autoFitColumns}
                            columns={table.columns}
                            enableAlternateRowColors={table.enableAlternateRowColors}
                            enableHorizontalBorders={table.enableHorizontalBorders}
                            enableRowHoverHighlight={table.enableRowHoverHighlight}
                            enableVerticalBorders={table.enableVerticalBorders}
                            itemsPerPage={itemsPerPage}
                            query={query}
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
