import { lazy, Suspense, useMemo } from 'react';

import { useListContext } from '/@/renderer/context/list-context';
import { ListFilters, ListFiltersTitle } from '/@/renderer/features/shared/components/list-filters';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { SaveAsCollectionButton } from '/@/renderer/features/shared/components/save-as-collection-button';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { ItemListSettings, useCurrentServer, useListSettings } from '/@/renderer/store';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, SongListQuery } from '/@/shared/types/domain-types';
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
    return (
        <>
            <SongListFilters />
            <SongListSuspenseContainer />
        </>
    );
};

const SongListFilters = () => {
    return (
        <ListWithSidebarContainer.SidebarPortal>
            <Stack h="100%" style={{ minHeight: 0 }}>
                <ListFiltersTitle itemType={LibraryItem.SONG} />
                <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                    <ListFilters itemType={LibraryItem.SONG} />
                </ScrollArea>
                <Stack p="sm">
                    <SaveAsCollectionButton fullWidth itemType={LibraryItem.SONG} />
                </Stack>
            </Stack>
        </ListWithSidebarContainer.SidebarPortal>
    );
};

const SongListSuspenseContainer = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);

    const { customFilters } = useListContext();

    return (
        <Suspense fallback={<Spinner container />}>
            <SongListView
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

export type OverrideSongListQuery = Omit<Partial<SongListQuery>, 'limit' | 'startIndex'>;

export const SongListView = ({
    display,
    grid,
    itemsPerPage,
    overrideQuery,
    pagination,
    table,
}: ItemListSettings & { overrideQuery?: OverrideSongListQuery }) => {
    const server = useCurrentServer();
    const { pageKey } = useListContext();

    const { query } = useSongListFilters(pageKey as ItemListKey);

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
                case ListPaginationType.INFINITE:
                    return (
                        <SongListInfiniteGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={mergedQuery}
                            serverId={server.id}
                            size={grid.size}
                        />
                    );
                case ListPaginationType.PAGINATED:
                    return (
                        <SongListPaginatedGrid
                            gap={grid.itemGap}
                            itemsPerPage={itemsPerPage}
                            itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                            query={mergedQuery}
                            serverId={server.id}
                            size={grid.size}
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
                case ListPaginationType.PAGINATED:
                    return (
                        <SongListPaginatedTable
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
                default:
                    return null;
            }
        }
    }

    return null;
};
