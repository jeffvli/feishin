import { lazy, Suspense } from 'react';

import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ItemListKey, ListDisplayType, ListPaginationType } from '/@/shared/types/types';

const SongListInfiniteGrid = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-infinite-grid').then((module) => ({
        default: module.SongListInfiniteGrid,
    })),
);
const SongListPaginatedGrid = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-paginated-grid').then((module) => ({
        default: module.SongListPaginatedGrid,
    })),
);
const SongListInfiniteTable = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-infinite-table').then((module) => ({
        default: module.SongListInfiniteTable,
    })),
);
const SongListPaginatedTable = lazy(() =>
    import('/@/renderer/features/songs/components/song-list-paginated-table').then((module) => ({
        default: module.SongListPaginatedTable,
    })),
);

export const SongListContent = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);

    return (
        <Suspense fallback={<Spinner container />}>
            <SongListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export const SongListView = ({
    display,
    grid,
    itemsPerPage,
    pagination,
    table,
}: ItemListSettings) => {
    const server = useCurrentServer();

    const { query } = useSongListFilters();

    switch (display) {
        case ListDisplayType.GRID: {
            switch (pagination) {
                case ListPaginationType.INFINITE:
                    return (
                        <SongListInfiniteGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={query}
                            serverId={server.id}
                        />
                    );
                case ListPaginationType.PAGINATED:
                    return (
                        <SongListPaginatedGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={query}
                            serverId={server.id}
                        />
                    );
                default:
                    return null;
            }
        }
        case ListDisplayType.TABLE: {
            switch (pagination) {
                case ListPaginationType.INFINITE:
                    return (
                        <SongListInfiniteTable
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
                case ListPaginationType.PAGINATED:
                    return (
                        <SongListPaginatedTable
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
                default:
                    return null;
            }
        }
    }

    return null;
};
