import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { MutableRefObject, useCallback } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { GENRE_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface GenreListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListTableView = ({ itemCount, tableRef }: GenreListTableViewProps) => {
    const server = useCurrentServer();
    const { customFilters, pageKey } = useListContext();
    const navigate = useNavigate();
    const genrePath = useGenreRoute();

    const tableProps = useVirtualTable({
        contextMenu: GENRE_CONTEXT_MENU_ITEMS,
        customFilters,
        itemCount,
        itemType: LibraryItem.GENRE,
        pageKey,
        server,
        tableRef,
    });

    const onRowDoubleClicked = useCallback(
        (e: RowDoubleClickedEvent) => {
            const { data } = e;
            if (!data) return;

            navigate(generatePath(genrePath, { genreId: data.id }));
        },
        [genrePath, navigate],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
                onRowDoubleClicked={onRowDoubleClicked}
            />
        </VirtualGridAutoSizerContainer>
    );
};
