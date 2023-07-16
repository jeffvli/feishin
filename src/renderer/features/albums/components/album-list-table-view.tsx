import { useCallback } from 'react';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListQuery, AlbumListResponse, LibraryItem } from '/@/renderer/api/types';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';
import {
    useCurrentServer,
    useAlbumListFilter,
    useListStoreActions,
    useAlbumListStore,
} from '/@/renderer/store';
import { ALBUM_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import {
    useVirtualTable,
    AgGridFetchFn,
} from '../../../components/virtual-table/hooks/use-virtual-table';

export const AlbumListTableView = ({ tableRef, itemCount }: any) => {
    const server = useCurrentServer();
    const { id, pageKey } = useAlbumListContext();
    const filter = useAlbumListFilter({ id, key: pageKey });
    const { setTable, setTablePagination } = useListStoreActions();
    const listProperties = useAlbumListStore({ id, key: pageKey });

    const fetchFn: AgGridFetchFn<
        AlbumListResponse,
        Omit<AlbumListQuery, 'startIndex'>
    > = useCallback(
        async ({ filter, limit, startIndex }, signal) => {
            const res = api.controller.getAlbumList({
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

    const tableProps = useVirtualTable<AlbumListResponse, Omit<AlbumListQuery, 'startIndex'>>({
        contextMenu: ALBUM_CONTEXT_MENU_ITEMS,
        fetch: {
            filter,
            fn: fetchFn,
            itemCount,
            queryKey: queryKeys.albums.list,
            server,
        },
        itemCount,
        itemType: LibraryItem.ALBUM,
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
