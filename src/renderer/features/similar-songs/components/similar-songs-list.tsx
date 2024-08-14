import { ErrorBoundary } from 'react-error-boundary';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable, getColumnDefs } from '/@/renderer/components/virtual-table';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { useSimilarSongs } from '/@/renderer/features/similar-songs/queries/similar-song-queries';
import { usePlayButtonBehavior, useTableSettings } from '/@/renderer/store';
import { useMemo, useRef } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { LibraryItem, Song } from '/@/renderer/api/types';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { Spinner } from '/@/renderer/components';
import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';

export type SimilarSongsListProps = {
    count?: number;
    fullScreen?: boolean;
    song: Song;
};

export const SimilarSongsList = ({ count, fullScreen, song }: SimilarSongsListProps) => {
    const tableRef = useRef<AgGridReact<Song> | null>(null);
    const tableConfig = useTableSettings(fullScreen ? 'fullScreen' : 'songs');
    const handlePlayQueueAdd = useHandlePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const songQuery = useSimilarSongs({
        options: {
            cacheTime: 1000 * 60 * 2,
            staleTime: 1000 * 60 * 1,
        },
        query: { albumArtistIds: song.albumArtists.map((art) => art.id), count, songId: song.id },
        serverId: song?.serverId,
    });

    const columnDefs = useMemo(
        () => getColumnDefs(tableConfig.columns, false, 'generic'),
        [tableConfig.columns],
    );

    const onCellContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<Song>) => {
        if (!e.data || !songQuery.data) return;

        handlePlayQueueAdd?.({
            byData: songQuery.data,
            initialSongId: e.data.id,
            playType: playButtonBehavior,
        });
    };

    return songQuery.isLoading ? (
        <Spinner
            container
            size={25}
        />
    ) : (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    ref={tableRef}
                    shouldUpdateSong
                    autoFitColumns={tableConfig.autoFit}
                    columnDefs={columnDefs}
                    context={{
                        count,
                        onCellContextMenu,
                        song,
                    }}
                    deselectOnClickOutside={fullScreen}
                    getRowId={(data) => data.data.id}
                    rowBuffer={50}
                    rowData={songQuery.data ?? []}
                    rowHeight={tableConfig.rowHeight || 40}
                    onCellContextMenu={onCellContextMenu}
                    onCellDoubleClicked={handleRowDoubleClick}
                />
            </VirtualGridAutoSizerContainer>
        </ErrorBoundary>
    );
};
