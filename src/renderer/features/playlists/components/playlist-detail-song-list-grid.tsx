import { forwardRef, useMemo } from 'react';
import { useEffect } from 'react';

import { useItemListScrollPersist } from '/@/renderer/components/item-list/helpers/use-item-list-scroll-persist';
import { ItemListGridComponentProps } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useListSettings } from '/@/renderer/store';
import { sortSongList } from '/@/shared/api/utils';
import {
    LibraryItem,
    PlaylistSongListQuery,
    PlaylistSongListResponse,
} from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';
import { ItemGridList } from '/@/renderer/components/item-list/item-grid-list/item-grid-list';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';

interface PlaylistDetailSongListGridProps
    extends Omit<ItemListGridComponentProps<PlaylistSongListQuery>, 'query'> {
    data: PlaylistSongListResponse;
}

export const PlaylistDetailSongListGrid = forwardRef<any, PlaylistDetailSongListGridProps>(
    ({ data, saveScrollOffset = true, size = 'default' }) => {
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
            }

            return sortSongList(items, query.sortBy, query.sortOrder);
        }, [data?.items, searchTerm, query.sortBy, query.sortOrder]);

        useEffect(() => {
            if (setListData) {
                setListData(songData);
            }
        }, [songData, setListData]);

        const rows = useGridRows(LibraryItem.SONG, ItemListKey.SONG, size);

        const gridProps = useListSettings(ItemListKey.PLAYLIST_SONG).grid;

        return (
            <ItemGridList
                data={songData}
                gap={gridProps.itemGap}
                initialTop={{
                    to: scrollOffset ?? 0,
                    type: 'offset',
                }}
                itemsPerRow={gridProps.itemsPerRowEnabled ? gridProps.itemsPerRow : undefined}
                itemType={LibraryItem.SONG}
                onScrollEnd={handleOnScrollEnd}
                rows={rows}
                size={size}
            />
        );
    },
);
