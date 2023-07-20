import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { MutableRefObject } from 'react';
import { useListContext } from '../../../context/list-context';
import { ARTIST_CONTEXT_MENU_ITEMS } from '../../context-menu/context-menu-items';
import { LibraryItem } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useCurrentServer } from '/@/renderer/store';

interface AlbumArtistListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListTableView = ({
    itemCount,
    tableRef,
}: AlbumArtistListTableViewProps) => {
    const server = useCurrentServer();
    const { pageKey } = useListContext();

    const tableProps = useVirtualTable({
        contextMenu: ARTIST_CONTEXT_MENU_ITEMS,
        itemCount,
        itemType: LibraryItem.ALBUM_ARTIST,
        pageKey,
        server,
        tableRef,
    });

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
            />
        </VirtualGridAutoSizerContainer>
    );
};
