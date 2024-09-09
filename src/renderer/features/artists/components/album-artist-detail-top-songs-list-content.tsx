import type { RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { MutableRefObject } from 'react';
import { useListContext } from '../../../context/list-context';
import { LibraryItem, QueueSong, SongListQuery } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';

interface AlbumArtistSongListContentProps {
    data: QueueSong[];
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistDetailTopSongsListContent = ({
    tableRef,
    data,
}: AlbumArtistSongListContentProps) => {
    const server = useCurrentServer();
    const { id, pageKey } = useListContext();

    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;

        const rowData: QueueSong[] = [];
        e.api.forEachNode((node) => {
            if (!node.data) return;
            rowData.push(node.data);
        });

        handlePlayQueueAdd?.({
            byData: rowData,
            initialSongId: e.data.id,
            playType: playButtonBehavior,
        });
    };

    const customFilters: Partial<SongListQuery> = {
        ...(id && { artistIds: [id] }),
    };

    const { rowClassRules } = useCurrentSongRowStyles({ tableRef });

    const tableProps = useVirtualTable({
        contextMenu: SONG_CONTEXT_MENU_ITEMS,
        customFilters,
        itemType: LibraryItem.SONG,
        pageKey,
        server,
        tableRef,
    });

    return (
        <>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    key={`table-${tableProps.rowHeight}-${server?.id}`}
                    ref={tableRef}
                    shouldUpdateSong
                    {...tableProps}
                    getRowId={(data) => data.data.uniqueId}
                    rowClassRules={rowClassRules}
                    rowData={data}
                    rowModelType="clientSide"
                    rowSelection="multiple"
                    onRowDoubleClicked={handleRowDoubleClick}
                />
            </VirtualGridAutoSizerContainer>
        </>
    );
};
