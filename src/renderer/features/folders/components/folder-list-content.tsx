import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useCallback, useEffect, useMemo } from 'react';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { DefaultItemControlProps } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { folderQueries } from '/@/renderer/features/folders/api/folder-api';
import { FolderTreeBrowser } from '/@/renderer/features/folders/components/folder-tree-browser';
import { useFolderListFilters } from '/@/renderer/features/folders/hooks/use-folder-list-filters';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { ListWithSidebarContainer } from '/@/renderer/features/shared/components/list-with-sidebar-container';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServerId, useListSettings, usePlayerSong } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Folder, LibraryItem, Song, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, Play } from '/@/shared/types/types';

export const FolderListContent = () => {
    return (
        <Suspense fallback={<Spinner container />}>
            <FolderListInnerContent />
        </Suspense>
    );
};

export const FolderListInnerContent = () => {
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const { currentFolderId, query } = useFolderListFilters();

    const getFolderQueryOptions = useCallback(
        (folderId: string) => {
            return folderQueries.folder({
                query: {
                    id: folderId,
                    searchTerm: query[FILTER_KEYS.SHARED.SEARCH_TERM] as string | undefined,
                    sortBy:
                        (query[FILTER_KEYS.SHARED.SORT_BY] as SongListSort) || SongListSort.NAME,
                    sortOrder: (query[FILTER_KEYS.SHARED.SORT_ORDER] as SortOrder) || SortOrder.ASC,
                },
                serverId,
            });
        },
        [serverId, query],
    );

    const rootFolderQuery = useQuery({
        ...getFolderQueryOptions('0'),
        staleTime: 1000 * 60 * 5,
    });

    const currentFolderQuery = useSuspenseQuery({
        ...getFolderQueryOptions(currentFolderId),
        staleTime: 1000 * 60,
    });

    const fetchFolder = useCallback(
        async (folderId: string) => {
            const queryOptions = getFolderQueryOptions(folderId);
            return queryClient.fetchQuery({
                ...queryOptions,
                staleTime: 1000 * 60 * 5,
            });
        },
        [getFolderQueryOptions, queryClient],
    );

    return (
        <>
            <ListWithSidebarContainer.SidebarPortal>
                <FolderTreeBrowser fetchFolder={fetchFolder} rootFolderQuery={rootFolderQuery} />
            </ListWithSidebarContainer.SidebarPortal>
            <FolderListView folderQuery={currentFolderQuery} />
        </>
    );
};

interface FolderListViewProps {
    folderQuery: ReturnType<typeof useSuspenseQuery<Folder>>;
}

export const FolderListView = ({ folderQuery }: FolderListViewProps) => {
    const { table } = useListSettings(ItemListKey.SONG);
    const display = ListDisplayType.TABLE;
    const { setItemCount } = useListContext();
    const { currentFolderId, navigateToFolder } = useFolderListFilters();
    const serverId = useCurrentServerId();

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
        enabled: true,
    });

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.SONG,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.SONG,
    });

    const allItems = useMemo(() => {
        if (!folderQuery.data?.children) {
            return [];
        }

        const { folders = [], songs = [] } = folderQuery.data.children;
        return [...folders, ...songs];
    }, [folderQuery.data]);

    useEffect(() => {
        setItemCount?.(allItems.length);
    }, [allItems.length, setItemCount]);

    const player = usePlayer();

    const overrideControls = useMemo(() => {
        return {
            onDoubleClick: ({ internalState, item, meta }: DefaultItemControlProps) => {
                if (!item) {
                    return;
                }

                if ((item as unknown as Folder)._itemType === LibraryItem.FOLDER) {
                    const folder = item as unknown as Folder;
                    return navigateToFolder(folder.id, folder.name);
                }

                const playType = (meta?.playType as Play) || Play.NOW;

                const data = internalState?.getData();
                if (!data) {
                    return;
                }

                const validSongs = data.filter((d): d is Song => {
                    return (
                        (d as unknown as { _itemType: LibraryItem })._itemType === LibraryItem.SONG
                    );
                }) as Song[];

                if (validSongs.length === 0) {
                    return;
                }

                player.addToQueueByData(validSongs, playType, item.id);
            },
        };
    }, [navigateToFolder, player]);

    const currentSong = usePlayerSong();

    switch (display) {
        // case ListDisplayType.GRID: {
        //     return (
        //         <ItemGridList
        //             data={allItems}
        //             gap={grid.itemGap}
        //             initialTop={{
        //                 to: scrollOffset ?? 0,
        //                 type: 'offset',
        //             }}
        //             itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
        //             itemType={LibraryItem.FOLDER}
        //             onScrollEnd={handleOnScrollEnd}
        //             overrideControls={overrideControls}
        //         />
        //     );
        // }
        case ListDisplayType.TABLE: {
            return (
                <ItemTableList
                    activeRowId={currentSong?.id}
                    autoFitColumns={table.autoFitColumns}
                    CellComponent={ItemTableListColumn}
                    columns={table.columns}
                    data={allItems}
                    enableAlternateRowColors={table.enableAlternateRowColors}
                    enableDrag={true}
                    enableExpansion={false}
                    enableHeader={table.enableHeader}
                    enableHorizontalBorders={table.enableHorizontalBorders}
                    enableRowHoverHighlight={table.enableRowHoverHighlight}
                    enableVerticalBorders={table.enableVerticalBorders}
                    initialTop={{
                        to: scrollOffset ?? 0,
                        type: 'offset',
                    }}
                    itemType={LibraryItem.FOLDER}
                    key={`folder-${serverId}-${currentFolderId}`}
                    onColumnReordered={handleColumnReordered}
                    onColumnResized={handleColumnResized}
                    onScrollEnd={handleOnScrollEnd}
                    overrideControls={overrideControls}
                    size={table.size}
                />
            );
        }
        default:
            return null;
    }
};
