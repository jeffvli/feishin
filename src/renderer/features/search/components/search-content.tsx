import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { MutableRefObject } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppRoute } from '../../../router/routes';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import {
    ALBUM_CONTEXT_MENU_ITEMS,
    ARTIST_CONTEXT_MENU_ITEMS,
    SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCurrentServer, useListStoreByKey, usePlayButtonBehavior } from '/@/renderer/store';

interface SearchContentProps {
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SearchContent = ({ tableRef }: SearchContentProps) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const { itemType } = useParams() as { itemType: LibraryItem };
    const [searchParams] = useSearchParams();
    const pageKey = itemType;
    const { filter } = useListStoreByKey({
        filter: { searchTerm: searchParams.get('query') || '' },
        key: itemType,
    });

    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const contextMenuItems = () => {
        switch (itemType) {
            case LibraryItem.ALBUM:
                return ALBUM_CONTEXT_MENU_ITEMS;
            case LibraryItem.ALBUM_ARTIST:
                return ARTIST_CONTEXT_MENU_ITEMS;
            case LibraryItem.SONG:
                return SONG_CONTEXT_MENU_ITEMS;
            default:
                return [];
        }
    };

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;
        switch (itemType) {
            case LibraryItem.ALBUM:
                navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
                break;
            case LibraryItem.ALBUM_ARTIST:
                navigate(
                    generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                        albumArtistId: e.data.id,
                    }),
                );
                break;
            case LibraryItem.SONG:
                handlePlayQueueAdd?.({
                    byItemType: {
                        id: [],
                        type: LibraryItem.SONG,
                    },
                    initialSongId: e.data.id,
                    playType: playButtonBehavior,
                    query: {
                        startIndex: 0,
                        ...filter,
                    },
                });
                break;
        }
    };

    const { rowClassRules } = useCurrentSongRowStyles({ tableRef });

    const tableProps = useVirtualTable({
        contextMenu: contextMenuItems(),
        customFilters: filter,
        itemType,
        pageKey,
        server,
        tableRef,
    });

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                {...tableProps}
                key={`table-${itemType}-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                context={{
                    query: searchParams.get('query'),
                }}
                getRowId={(data) => data.data.id}
                infiniteInitialRowCount={25}
                rowClassRules={rowClassRules}
                shouldUpdateSong={itemType === LibraryItem.SONG}
                onRowDoubleClicked={handleRowDoubleClick}
            />
        </VirtualGridAutoSizerContainer>
    );
};
