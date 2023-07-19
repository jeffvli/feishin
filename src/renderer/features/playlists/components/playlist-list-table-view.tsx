import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useCallback } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, PlaylistListQuery, PlaylistListResponse } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import {
    AgGridFetchFn,
    useVirtualTable,
} from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { PLAYLIST_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCurrentServer,
    useGeneralSettings,
    useListStoreActions,
    usePlaylistListFilter,
    usePlaylistListStore,
} from '/@/renderer/store';

interface PlaylistListTableViewProps {
    itemCount?: number;
    tableRef: React.MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListTableView = ({ tableRef, itemCount }: PlaylistListTableViewProps) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const { defaultFullPlaylist } = useGeneralSettings();
    const { setTable, setTablePagination } = useListStoreActions();
    const pageKey = 'playlist';
    const filter = usePlaylistListFilter({ key: pageKey });
    const listProperties = usePlaylistListStore({ key: pageKey });

    console.log('listProperties :>> ', listProperties);

    const fetchFn: AgGridFetchFn<
        PlaylistListResponse,
        Omit<PlaylistListQuery, 'startIndex'>
    > = useCallback(
        async ({ filter, limit, startIndex }, signal) => {
            const res = api.controller.getPlaylistList({
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

    const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
        if (!e.data) return;
        if (defaultFullPlaylist) {
            navigate(generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: e.data.id }));
        } else {
            navigate(generatePath(AppRoute.PLAYLISTS_DETAIL, { playlistId: e.data.id }));
        }
    };

    const tableProps = useVirtualTable<PlaylistListResponse, Omit<PlaylistListQuery, 'startIndex'>>(
        {
            contextMenu: PLAYLIST_CONTEXT_MENU_ITEMS,
            fetch: {
                filter,
                fn: fetchFn,
                itemCount,
                queryKey: queryKeys.playlists.list,
                server,
            },
            itemCount,
            itemType: LibraryItem.PLAYLIST,
            pageKey,
            properties: listProperties,
            setTable,
            setTablePagination,
            tableRef,
        },
    );

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                key={`table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
                onRowDoubleClicked={handleRowDoubleClick}
            />
        </VirtualGridAutoSizerContainer>
    );
};
