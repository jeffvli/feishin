import { useEffect, useMemo } from 'react';

import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemDetailList } from '/@/renderer/components/item-list/item-detail-list/item-detail-list';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { useItemListPagination } from '/@/renderer/components/item-list/item-list-pagination/use-item-list-pagination';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { DefaultItemControlProps, ItemControls } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { applyClientSideSongFilters } from '/@/renderer/features/playlists/hooks/use-playlist-track-list';
import { type PlaylistAlbumRow, playlistSongsToAlbums } from '/@/renderer/features/playlists/utils';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useGeneralSettings, useListSettings } from '/@/renderer/store';
import { sortSongList } from '/@/shared/api/utils';
import {
    LibraryItem,
    PlaylistSongListResponse,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import {
    ItemListKey,
    ListDisplayType,
    ListPaginationType,
    Play,
    TableColumn,
} from '/@/shared/types/types';

export const PlaylistDetailAlbumView = ({ data }: { data: PlaylistSongListResponse }) => {
    const player = usePlayer();
    const { setItemCount, setListData } = useListContext();
    const { detail, display, grid, itemsPerPage, pagination, table } = useListSettings(
        ItemListKey.PLAYLIST_ALBUM,
    );
    const { enableGridMultiSelect } = useGeneralSettings();
    const { currentPage, onChange: onPageChange } = useItemListPagination();
    const { searchTerm } = useSearchTermFilter();
    const { query } = usePlaylistSongListFilters();

    const filteredAndSortedSongs = useMemo(() => {
        const raw = data?.items ?? [];
        const filtered = applyClientSideSongFilters(raw, query as Record<string, unknown>);

        const searched = searchTerm?.trim()
            ? searchLibraryItems(filtered, searchTerm, LibraryItem.SONG)
            : filtered;

        return sortSongList(
            searched,
            (query.sortBy as SongListSort) ?? SongListSort.ID,
            (query.sortOrder as SortOrder) ?? SortOrder.ASC,
        );
    }, [data?.items, query, searchTerm]);

    const sortedAlbums = useMemo(
        () => playlistSongsToAlbums(filteredAndSortedSongs),
        [filteredAndSortedSongs],
    );

    const isPaginated = pagination === ListPaginationType.PAGINATED;
    const totalAlbumCount = sortedAlbums.length;
    const albumPageCount = Math.max(1, Math.ceil(totalAlbumCount / itemsPerPage));
    const paginatedAlbums = useMemo(() => {
        if (!isPaginated) return sortedAlbums;
        const start = currentPage * itemsPerPage;
        return sortedAlbums.slice(start, start + itemsPerPage);
    }, [isPaginated, currentPage, itemsPerPage, sortedAlbums]);
    const albumsToRender = isPaginated ? paginatedAlbums : sortedAlbums;

    const playlistSongs = useMemo(() => data?.items ?? [], [data?.items]);

    const albumControlOverrides = useMemo<Partial<ItemControls>>(() => {
        return {
            onFavorite: undefined,
            onMore: ({ event, internalState, item }: DefaultItemControlProps) => {
                if (!event) return;

                const selected = internalState?.getSelected();

                if (selected?.length === 0 && !item) {
                    return;
                }

                let itemsToUse: (PlaylistAlbumRow | Song)[];
                if ((selected?.length ?? 0) > 0) {
                    itemsToUse = selected as (PlaylistAlbumRow | Song)[];
                } else {
                    itemsToUse = [item as PlaylistAlbumRow | Song];
                }

                const songs: Song[] = [];
                for (const item of itemsToUse) {
                    if (item._itemType === LibraryItem.ALBUM) {
                        songs.push(...((item as PlaylistAlbumRow)._playlistSongs ?? []));
                    } else if (item._itemType === LibraryItem.SONG) {
                        songs.push(item as Song);
                    }
                }

                ContextMenuController.call({
                    cmd: { items: songs, type: LibraryItem.PLAYLIST_SONG },
                    event,
                });
            },
            onPlay: ({
                item,
                itemType,
                playType,
            }: DefaultItemControlProps & { playType: Play }) => {
                if (!item) return;

                const rowSongs = (item as PlaylistAlbumRow)._playlistSongs;
                if (itemType === LibraryItem.ALBUM && rowSongs?.length) {
                    player.addToQueueByData(rowSongs, playType);
                    return;
                }
                player.addToQueueByFetch(item._serverId, [item.id], itemType, playType);
            },
            onRating: undefined,
        };
    }, [player]);

    useEffect(() => {
        setItemCount?.(totalAlbumCount);
    }, [setItemCount, totalAlbumCount]);

    useEffect(() => {
        setListData?.(filteredAndSortedSongs);
    }, [filteredAndSortedSongs, setListData]);

    const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({ enabled: true });
    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
    });
    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
    });
    const { handleColumnReordered: handleDetailColumnReordered } = useItemListColumnReorder({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
        tableKey: 'detail',
    });
    const { handleColumnResized: handleDetailColumnResized } = useItemListColumnResize({
        itemListKey: ItemListKey.PLAYLIST_ALBUM,
        tableKey: 'detail',
    });
    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.PLAYLIST_ALBUM, grid.size);

    const tableColumns = useMemo(() => {
        return table.columns.filter(
            (column) =>
                column.id !== TableColumn.USER_FAVORITE && column.id !== TableColumn.USER_RATING,
        );
    }, [table.columns]);

    const renderAlbumList = () => {
        switch (display) {
            case ListDisplayType.DETAIL:
                return (
                    <ItemDetailList
                        enableHeader={detail?.enableHeader}
                        items={albumsToRender}
                        listKey={ItemListKey.PLAYLIST_ALBUM}
                        onColumnReordered={handleDetailColumnReordered}
                        onColumnResized={handleDetailColumnResized}
                        onScrollEnd={handleOnScrollEnd}
                        onSongRowDoubleClick={({ internalState, item }) => {
                            if (playlistSongs.length === 0) return;
                            internalState?.setSelected([item]);
                            player.addToQueueByData(playlistSongs, Play.NOW, item.id);
                        }}
                        overrideControls={albumControlOverrides}
                        scrollOffset={scrollOffset ?? 0}
                        songsByAlbumId={{}}
                        tableId="album-detail"
                    />
                );
            case ListDisplayType.GRID:
                return (
                    <ItemGridList
                        data={albumsToRender}
                        enableExpansion
                        enableMultiSelect={enableGridMultiSelect}
                        gap={grid.itemGap}
                        initialTop={{
                            to: scrollOffset ?? 0,
                            type: 'offset',
                        }}
                        itemsPerRow={grid.itemsPerRowEnabled ? grid.itemsPerRow : undefined}
                        itemType={LibraryItem.ALBUM}
                        onScrollEnd={handleOnScrollEnd}
                        overrideControls={albumControlOverrides}
                        rows={rows}
                        size={grid.size}
                    />
                );
            case ListDisplayType.TABLE:
                return (
                    <ItemTableList
                        autoFitColumns={table.autoFitColumns}
                        CellComponent={ItemTableListColumn}
                        columns={tableColumns}
                        data={albumsToRender}
                        enableAlternateRowColors={table.enableAlternateRowColors}
                        enableHeader={table.enableHeader}
                        enableHorizontalBorders={table.enableHorizontalBorders}
                        enableRowHoverHighlight={table.enableRowHoverHighlight}
                        enableSelection
                        enableVerticalBorders={table.enableVerticalBorders}
                        initialTop={{
                            to: scrollOffset ?? 0,
                            type: 'offset',
                        }}
                        itemType={LibraryItem.ALBUM}
                        onColumnReordered={handleColumnReordered}
                        onColumnResized={handleColumnResized}
                        onScrollEnd={handleOnScrollEnd}
                        overrideControls={albumControlOverrides}
                        size={table.size}
                    />
                );
            default:
                return null;
        }
    };

    if (isPaginated) {
        return (
            <ItemListWithPagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onChange={onPageChange}
                pageCount={albumPageCount}
                totalItemCount={totalAlbumCount}
            >
                {renderAlbumList()}
            </ItemListWithPagination>
        );
    }

    return renderAlbumList();
};
