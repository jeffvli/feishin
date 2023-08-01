import { LibraryItem } from '/@/renderer/api/types';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { ALBUM_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useCurrentServer } from '/@/renderer/store';
import { MutableRefObject } from 'react';

interface GenreListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListTableView = ({ tableRef, itemCount }: GenreListTableViewProps) => {
    const server = useCurrentServer();
    const { pageKey, customFilters } = useListContext();

    const tableProps = useVirtualTable({
        contextMenu: ALBUM_CONTEXT_MENU_ITEMS,
        customFilters,
        itemCount,
        itemType: LibraryItem.GENRE,
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
