import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { MutableRefObject, useCallback } from 'react';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, QueueSong, SongListQuery, SongListResponse } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import {
    AgGridFetchFn,
    useVirtualTable,
} from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useSongListContext } from '/@/renderer/features/songs/context/song-list-context';
import {
    useCurrentServer,
    useListStoreActions,
    usePlayButtonBehavior,
    useSongListFilter,
    useSongListStore,
} from '/@/renderer/store';

interface SongListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListTableView = ({ tableRef, itemCount }: SongListTableViewProps) => {
    const server = useCurrentServer();
    const { id, pageKey, handlePlay } = useSongListContext();
    const filter = useSongListFilter({ id, key: pageKey });
    const listProperties = useSongListStore({ id, key: pageKey });

    const { setTable, setTablePagination } = useListStoreActions();

    const fetchFn: AgGridFetchFn<SongListResponse, Omit<SongListQuery, 'startIndex'>> = useCallback(
        async ({ filter, limit, startIndex }, signal) => {
            const res = api.controller.getSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: {
                    ...filter,
                    limit,
                    sortBy: filter.sortBy,
                    sortOrder: filter.sortOrder,
                    startIndex,
                },
            });

            return res;
        },
        [server],
    );

    const tableProps = useVirtualTable<SongListResponse, Omit<SongListQuery, 'startIndex'>>({
        contextMenu: SONG_CONTEXT_MENU_ITEMS,
        fetch: {
            filter,
            fn: fetchFn,
            itemCount,
            queryKey: queryKeys.albums.list,
            server,
        },
        itemCount,
        itemType: LibraryItem.SONG,
        pageKey,
        properties: listProperties,
        setTable,
        setTablePagination,
        tableRef,
    });

    const playButtonBehavior = usePlayButtonBehavior();
    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;
        handlePlay?.({ initialSongId: e.data.id, playType: playButtonBehavior });
    };

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${listProperties.display}-${listProperties.table.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
                onRowDoubleClicked={handleRowDoubleClick}
            />
        </VirtualGridAutoSizerContainer>
    );
};
