import { lazy, Suspense, useMemo } from 'react';

import { useGenreListFilters } from '/@/renderer/features/genres/hooks/use-genre-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { GenreListQuery } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, ListPaginationType } from '/@/shared/types/types';

const GenreListInfiniteGrid = lazy(() =>
    import('/@/renderer/features/genres/components/genre-list-infinite-grid').then((module) => ({
        default: module.GenreListInfiniteGrid,
    })),
);

const GenreListPaginatedGrid = lazy(() =>
    import('/@/renderer/features/genres/components/genre-list-paginated-grid').then((module) => ({
        default: module.GenreListPaginatedGrid,
    })),
);

const GenreListInfiniteTable = lazy(() =>
    import('/@/renderer/features/genres/components/genre-list-infinite-table').then((module) => ({
        default: module.GenreListInfiniteTable,
    })),
);

const GenreListPaginatedTable = lazy(() =>
    import('/@/renderer/features/genres/components/genre-list-paginated-table').then((module) => ({
        default: module.GenreListPaginatedTable,
    })),
);

export const GenreListContent = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.GENRE);

    return (
        <Suspense fallback={<Spinner container />}>
            <GenreListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export const GenreListView = ({
    display,
    grid,
    itemsPerPage,
    overrideQuery,
    pagination,
    table,
}: ItemListSettings & { overrideQuery?: Omit<GenreListQuery, 'limit' | 'startIndex'> }) => {
    const server = useCurrentServer();

    const { query } = useGenreListFilters();

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
                        <GenreListInfiniteGrid
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
                        <GenreListPaginatedGrid
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
                        <GenreListInfiniteTable
                            autoFitColumns={table.autoFitColumns}
                            columns={table.columns}
                            enableAlternateRowColors={table.enableAlternateRowColors}
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
                        <GenreListPaginatedTable
                            autoFitColumns={table.autoFitColumns}
                            columns={table.columns}
                            enableAlternateRowColors={table.enableAlternateRowColors}
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
