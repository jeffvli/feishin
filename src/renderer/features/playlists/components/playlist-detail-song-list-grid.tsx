import { forwardRef, useMemo } from 'react';
import { useEffect } from 'react';

import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { ItemListWithPagination } from '/@/renderer/components/item-list/item-list-pagination/item-list-pagination';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useGeneralSettings, useListSettings } from '/@/renderer/store';
import { sortSongList } from '/@/shared/api/utils';
import {
    LibraryItem,
    PlaylistSongListQuery,
    PlaylistSongListResponse,
    Song,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlaylistDetailSongListGridProps
    extends Omit<ItemListGridComponentProps<PlaylistSongListQuery>, 'query'> {
    currentPage?: number;
    data: PlaylistSongListResponse;
    items?: Song[];
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
}

export const PlaylistDetailSongListGrid = forwardRef<any, PlaylistDetailSongListGridProps>(
    ({
        currentPage,
        data,
        items: itemsProp,
        itemsPerPage,
        onPageChange,
        saveScrollOffset = true,
    }) => {
        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
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

        const gridProps = useListSettings(ItemListKey.PLAYLIST_SONG).grid;

        const rows = useGridRows(
            LibraryItem.PLAYLIST_SONG,
            ItemListKey.PLAYLIST_SONG,
            gridProps.size,
        );
        const { enableGridMultiSelect } = useGeneralSettings();

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
        }, [currentPage, isPaginated, itemsPerPage, songData]);
        const dataToRender = isPaginated ? paginatedData : songData;

        const grid = (
            <ItemGridList
                data={dataToRender}
                enableMultiSelect={enableGridMultiSelect}
                gap={gridProps.itemGap}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemsPerRow={gridProps.itemsPerRowEnabled ? gridProps.itemsPerRow : undefined}
                itemType={LibraryItem.PLAYLIST_SONG}
                onScrollEnd={handleOnScrollEnd}
                rows={rows}
                size={gridProps.size}
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
                    {grid}
                </ItemListWithPagination>
            );
        }

        return grid;
    },
);
