import { MutableRefObject, useCallback } from 'react';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { AlbumArtistListQuery, AlbumArtistListResponse, LibraryItem } from '/@/renderer/api/types';
import {
    AgGridFetchFn,
    useVirtualTable,
} from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useAlbumArtistListContext } from '/@/renderer/features/artists/context/album-artist-list-context';
import { ARTIST_CONTEXT_MENU_ITEMS } from '../../context-menu/context-menu-items';
import {
    useAlbumArtistListFilter,
    useAlbumArtistListStore,
    useCurrentServer,
    useListStoreActions,
} from '/@/renderer/store';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';

interface AlbumArtistListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListTableView = ({
    itemCount,
    tableRef,
}: AlbumArtistListTableViewProps) => {
    const server = useCurrentServer();
    const { id, pageKey } = useAlbumArtistListContext();
    const filter = useAlbumArtistListFilter({ id, key: pageKey });
    const listProperties = useAlbumArtistListStore();
    const { setTable, setTablePagination } = useListStoreActions();

    const fetchFn: AgGridFetchFn<
        AlbumArtistListResponse,
        Omit<AlbumArtistListQuery, 'startIndex'>
    > = useCallback(
        async ({ filter, limit, startIndex }, signal) => {
            const res = api.controller.getAlbumArtistList({
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

    const tableProps = useVirtualTable<
        AlbumArtistListResponse,
        Omit<AlbumArtistListQuery, 'startIndex'>
    >({
        contextMenu: ARTIST_CONTEXT_MENU_ITEMS,
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

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${listProperties.display}-${listProperties.table.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
            />
        </VirtualGridAutoSizerContainer>
    );
};
