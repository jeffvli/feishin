import { forwardRef, useMemo } from 'react';
import { useEffect } from 'react';

import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
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
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlaylistDetailSongListGridProps
    extends Omit<ItemListGridComponentProps<PlaylistSongListQuery>, 'query'> {
    data: PlaylistSongListResponse;
}

export const PlaylistDetailSongListGrid = forwardRef<any, PlaylistDetailSongListGridProps>(
    ({ data, saveScrollOffset = true }) => {
        const { handleOnScrollEnd, scrollOffset } = useItemListScrollPersist({
            enabled: saveScrollOffset,
        });

        const { searchTerm } = useSearchTermFilter();
        const { query } = usePlaylistSongListFilters();
        const { setListData } = useListContext();

        const songData = useMemo(() => {
            let items = data?.items || [];

            if (searchTerm) {
                items = searchLibraryItems(items, searchTerm, LibraryItem.SONG);
                return items;
            }

            return sortSongList(items, query.sortBy, query.sortOrder);
        }, [data?.items, searchTerm, query.sortBy, query.sortOrder]);

        useEffect(() => {
            if (setListData) {
                setListData(songData);
            }
        }, [songData, setListData]);

        const gridProps = useListSettings(ItemListKey.PLAYLIST_SONG).grid;

        const rows = useGridRows(
            LibraryItem.PLAYLIST_SONG,
            ItemListKey.PLAYLIST_SONG,
            gridProps.size,
        );
        const { enableGridMultiSelect } = useGeneralSettings();

        return (
            <ItemGridList
                data={songData}
                enableMultiSelect={enableGridMultiSelect}
                gap={gridProps.itemGap}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemsPerRow={gridProps.itemsPerRowEnabled ? gridProps.itemsPerRow : undefined}
                itemType={LibraryItem.SONG}
                onScrollEnd={handleOnScrollEnd}
                rows={rows}
                size={gridProps.size}
            />
        );
    },
);
