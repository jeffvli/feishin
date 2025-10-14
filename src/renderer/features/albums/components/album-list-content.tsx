import { lazy, Suspense } from 'react';

import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ItemListKey, ListDisplayType, ListPaginationType } from '/@/shared/types/types';

const AlbumListInfiniteGrid = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-infinite-grid').then((module) => ({
        default: module.AlbumListInfiniteGrid,
    })),
);

const AlbumListPaginatedGrid = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-paginated-grid').then((module) => ({
        default: module.AlbumListPaginatedGrid,
    })),
);

const AlbumListInfiniteTable = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-infinite-table').then((module) => ({
        default: module.AlbumListInfiniteTable,
    })),
);

const AlbumListPaginatedTable = lazy(() =>
    import('/@/renderer/features/albums/components/album-list-paginated-table').then((module) => ({
        default: module.AlbumListPaginatedTable,
    })),
);

export const AlbumListContent = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);

    return (
        <Suspense fallback={<Spinner container />}>
            <AlbumListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export const AlbumListView = ({
    display,
    grid,
    itemsPerPage,
    pagination,
    table,
}: ItemListSettings) => {
    const server = useCurrentServer();

    const { query } = useAlbumListFilters();

    switch (display) {
        case ListDisplayType.GRID: {
            switch (pagination) {
                case ListPaginationType.INFINITE: {
                    return (
                        <AlbumListInfiniteGrid
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
                        <AlbumListPaginatedGrid
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
                        <AlbumListInfiniteTable
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
                        <AlbumListPaginatedTable
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
