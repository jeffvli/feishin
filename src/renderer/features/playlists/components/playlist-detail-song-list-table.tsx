import { forwardRef, useMemo } from 'react';
import { useEffect } from 'react';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemControls, ItemListTableComponentProps } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { usePlayerSong } from '/@/renderer/store';
import { sortSongList } from '/@/shared/api/utils';
import {
    LibraryItem,
    PlaylistSongListQuery,
    PlaylistSongListResponse,
    Song,
} from '/@/shared/types/domain-types';
import { ItemListKey, Play } from '/@/shared/types/types';

interface PlaylistDetailSongListTableProps
    extends Omit<ItemListTableComponentProps<PlaylistSongListQuery>, 'query'> {
    currentPage?: number;
    data: PlaylistSongListResponse;
    items?: Song[];
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
}

export const PlaylistDetailSongListTable = forwardRef<any, PlaylistDetailSongListTableProps>(
    (
        {
            autoFitColumns = false,
            columns,
            currentPage,
            data,
            enableAlternateRowColors = false,
            enableHeader = true,
            enableHorizontalBorders = false,
            enableRowHoverHighlight = true,
            enableSelection = true,
            enableVerticalBorders = false,
            items: itemsProp,
            itemsPerPage,
            onPageChange,
            saveScrollOffset = true,
            size = 'default',
        },
        ref,
    ) => {
        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        const { handleColumnReordered } = useItemListColumnReorder({
            itemListKey: ItemListKey.PLAYLIST_SONG,
        });

        const { handleColumnResized } = useItemListColumnResize({
            itemListKey: ItemListKey.PLAYLIST_SONG,
        });

        const { searchTerm } = useSearchTermFilter();
        const { query } = usePlaylistSongListFilters();

        const songDataFromData = useMemo(() => {
            let list = data?.items || [];
            if (searchTerm) {
                list = searchLibraryItems(list, searchTerm, LibraryItem.SONG);
                return list;
            }
            return sortSongList(list, query.sortBy, query.sortOrder);
        }, [data?.items, searchTerm, query.sortBy, query.sortOrder]);

        const { setListData } = useListContext();
        const songData = itemsProp ?? songDataFromData;

        useEffect(() => {
            if (itemsProp == null && setListData) {
                setListData(songDataFromData);
            }
        }, [itemsProp, songDataFromData, setListData]);

        const player = usePlayer();

        const currentSong = usePlayerSong();

        const overrideControls: Partial<ItemControls> = useMemo(() => {
            return {
                onDoubleClick: ({ index, internalState, item, meta }) => {
                    if (!item) {
                        return;
                    }

                    const playType = (meta?.playType as Play) || Play.NOW;
                    const items = internalState?.getData() as Song[];

                    if (index !== undefined) {
                        player.addToQueueByData(items, playType, item.id);
                    }
                },
            };
        }, [player]);

        const getRowId = useMemo(() => {
            return (item: unknown) => {
                if (!item || typeof item !== 'object') {
                    return 'id';
                }
                const song = item as Song;
                return song.playlistItemId || song.id;
            };
        }, []);

        const isPaginated =
            typeof currentPage === 'number' &&
            typeof itemsPerPage === 'number' &&
            typeof onPageChange === 'function';
        const totalCount = songData.length;
        const pageCount = Math.max(1, Math.ceil(totalCount / (itemsPerPage ?? 1)));
        const paginatedData = useMemo(() => {
            if (!isPaginated || currentPage == null || itemsPerPage == null) return songData;
            const start = currentPage * itemsPerPage;
            return songData.slice(start, start + itemsPerPage);
        }, [isPaginated, currentPage, itemsPerPage, songData]);
        const dataToRender = isPaginated ? paginatedData : songData;

        const table = (
            <ItemTableList
                activeRowId={currentSong?.id}
                autoFitColumns={autoFitColumns}
                CellComponent={ItemTableListColumn}
                columns={columns}
                data={dataToRender}
                enableAlternateRowColors={enableAlternateRowColors}
                enableExpansion={false}
                enableHeader={enableHeader}
                enableHorizontalBorders={enableHorizontalBorders}
                enableRowHoverHighlight={enableRowHoverHighlight}
                enableSelection={enableSelection}
                enableVerticalBorders={enableVerticalBorders}
                getRowId={getRowId}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.PLAYLIST_SONG}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                onScrollEnd={handleOnScrollEnd}
                overrideControls={overrideControls}
                ref={ref}
                size={size}
            />
        );

        if (isPaginated && itemsPerPage != null) {
            return (
                <ItemListWithPagination
                    currentPage={currentPage!}
                    itemsPerPage={itemsPerPage}
                    onChange={onPageChange!}
                    pageCount={pageCount}
                    totalItemCount={totalCount}
                >
                    {table}
                </ItemListWithPagination>
            );
        }

        return table;
    },
);

export const PlaylistDetailSongListEditTable = forwardRef<any, PlaylistDetailSongListTableProps>(
    (
        {
            autoFitColumns = false,
            columns,
            data,
            enableAlternateRowColors = false,
            enableHeader = true,
            enableHorizontalBorders = false,
            enableRowHoverHighlight = true,
            enableSelection = true,
            enableVerticalBorders = false,
            saveScrollOffset = true,
            size = 'default',
        },
        ref,
    ) => {
        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        const { handleColumnReordered } = useItemListColumnReorder({
            itemListKey: ItemListKey.PLAYLIST_SONG,
        });

        const { handleColumnResized } = useItemListColumnResize({
            itemListKey: ItemListKey.PLAYLIST_SONG,
        });

        const player = usePlayer();

        const currentSong = usePlayerSong();

        const overrideControls: Partial<ItemControls> = useMemo(() => {
            return {
                onDoubleClick: ({ index, internalState, item, meta }) => {
                    if (!item) {
                        return;
                    }

                    const playType = (meta?.playType as Play) || Play.NOW;
                    const items = internalState?.getData() as Song[];

                    if (index !== undefined) {
                        player.addToQueueByData(items, playType, item.id);
                    }
                },
            };
        }, [player]);

        const getRowId = useMemo(() => {
            return (item: unknown) => {
                if (!item || typeof item !== 'object') {
                    return 'id';
                }
                const song = item as Song;
                return song.playlistItemId || song.id;
            };
        }, []);

        return (
            <ItemTableList
                activeRowId={currentSong?.id}
                autoFitColumns={autoFitColumns}
                CellComponent={ItemTableListColumn}
                columns={columns}
                data={data.items}
                enableAlternateRowColors={enableAlternateRowColors}
                enableDrag
                enableExpansion={false}
                enableHeader={enableHeader}
                enableHorizontalBorders={enableHorizontalBorders}
                enableRowHoverHighlight={enableRowHoverHighlight}
                enableSelection={enableSelection}
                enableVerticalBorders={enableVerticalBorders}
                getRowId={getRowId}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.PLAYLIST_SONG}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                onScrollEnd={handleOnScrollEnd}
                overrideControls={overrideControls}
                ref={ref}
                size={size}
            />
        );
    },
);
