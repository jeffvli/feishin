import { MutableRefObject } from 'react';
import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { generatePath, useNavigate } from 'react-router';
import { LibraryItem } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { PLAYLIST_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';

interface PlaylistListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListTableView = ({ tableRef, itemCount }: PlaylistListTableViewProps) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const pageKey = 'playlist';

    const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
        if (!e.data) return;
        navigate(generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId: e.data.id }));
    };

    const tableProps = useVirtualTable({
        contextMenu: PLAYLIST_CONTEXT_MENU_ITEMS,
        itemCount,
        itemType: LibraryItem.PLAYLIST,
        pageKey,
        server,
        tableRef,
    });

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
