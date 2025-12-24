import { lazy, Suspense, useMemo } from 'react';

import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { ListFilters, ListFiltersTitle } from '/@/renderer/features/shared/components/list-filters';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { AlbumListQuery, LibraryItem } from '/@/shared/types/domain-types';
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

const AlbumListFilters = () => {
    return (
        <ListWithSidebarContainer.SidebarPortal>
            <Stack h="100%">
                <ListFiltersTitle />
                <ScrollArea>
                    <ListFilters itemType={LibraryItem.ALBUM} />
                </ScrollArea>
            </Stack>
        </ListWithSidebarContainer.SidebarPortal>
    );
};

export const AlbumListContent = () => {
    return (
        <>
            <AlbumListFilters />
            <AlbumListSuspenseContainer />
        </>
    );
};

const AlbumListSuspenseContainer = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);

    const { customFilters } = useListContext();

    return (
        <Suspense fallback={<Spinner container />}>
            <AlbumListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                overrideQuery={customFilters}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
};

export type OverrideAlbumListQuery = Omit<Partial<AlbumListQuery>, 'limit' | 'startIndex'>;

export const AlbumListView = ({
    display,
    grid,
    itemsPerPage,
    overrideQuery,
    pagination,
    table,
}: ItemListSettings & { overrideQuery?: OverrideAlbumListQuery }) => {
    const server = useCurrentServer();
    const { pageKey } = useListContext();

    const { query } = useAlbumListFilters(pageKey as ItemListKey);

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
                        <AlbumListInfiniteGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={mergedQuery}
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
                            query={mergedQuery}
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
                        <AlbumListPaginatedTable
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
