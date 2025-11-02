import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { MutableRefObject } from 'react';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { ARTIST_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ArtistListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const ArtistListTableView = ({ itemCount, tableRef }: ArtistListTableViewProps) => {
    const server = useCurrentServer();
    const { pageKey } = useListContext();

    const tableProps = useVirtualTable({
        contextMenu: ARTIST_CONTEXT_MENU_ITEMS,
        itemCount,
        itemType: LibraryItem.ARTIST,
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
