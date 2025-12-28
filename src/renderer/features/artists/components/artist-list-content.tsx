import { lazy, Suspense, useMemo } from 'react';

import { useArtistListFilters } from '/@/renderer/features/artists/hooks/use-artist-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ArtistListQuery } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, ListPaginationType } from '/@/shared/types/types';

const ArtistListInfiniteGrid = lazy(() =>
    import('/@/renderer/features/artists/components/artist-list-infinite-grid').then((module) => ({
        default: module.ArtistListInfiniteGrid,
    })),
);

const ArtistListPaginatedGrid = lazy(() =>
    import('/@/renderer/features/artists/components/artist-list-paginated-grid').then((module) => ({
        default: module.ArtistListPaginatedGrid,
    })),
);

const ArtistListInfiniteTable = lazy(() =>
    import('/@/renderer/features/artists/components/artist-list-infinite-table').then((module) => ({
        default: module.ArtistListInfiniteTable,
    })),
);

const ArtistListPaginatedTable = lazy(() =>
    import('/@/renderer/features/artists/components/artist-list-paginated-table').then(
        (module) => ({
            default: module.ArtistListPaginatedTable,
        }),
    ),
);

export const ArtistListContent = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ARTIST);

    return (
        <Suspense fallback={<Spinner container />}>
            <ArtistListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export type OverrideArtistListQuery = Omit<ArtistListQuery, 'limit' | 'startIndex'>;

export const ArtistListView = ({
    display,
    grid,
    itemsPerPage,
    overrideQuery,
    pagination,
    table,
}: ItemListSettings & { overrideQuery?: OverrideArtistListQuery }) => {
    const server = useCurrentServer();

    const { query } = useArtistListFilters();

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
                        <ArtistListInfiniteGrid
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
                        <ArtistListPaginatedGrid
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
                        <ArtistListInfiniteTable
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
                        <ArtistListPaginatedTable
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
