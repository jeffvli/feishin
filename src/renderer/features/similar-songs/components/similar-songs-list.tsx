import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import { getColumnDefs, VirtualTable } from '/@/renderer/components/virtual-table';
import { ErrorFallback } from '/@/renderer/features/action-required/components/error-fallback';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { usePlayButtonBehavior, useTableSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

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

    const songQuery = useQuery(
        songsQueries.similar({
            options: {
                gcTime: 1000 * 60 * 2,
            },
            query: {
                albumArtistIds: song.albumArtists.map((art) => art.id),
                count,
                songId: song.id,
            },
            serverId: song?.serverId,
        }),
    );

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
        <Spinner container size={25} />
    ) : (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    autoFitColumns={tableConfig.autoFit}
                    columnDefs={columnDefs}
                    context={{
                        count,
                        itemType: LibraryItem.SONG,
                        onCellContextMenu,
                        song,
                    }}
                    deselectOnClickOutside={fullScreen}
                    getRowId={(data) => data.data.uniqueId}
                    onCellContextMenu={onCellContextMenu}
                    onCellDoubleClicked={handleRowDoubleClick}
                    ref={tableRef}
                    rowBuffer={50}
                    rowData={songQuery.data ?? []}
                    rowHeight={tableConfig.rowHeight || 40}
                    shouldUpdateSong
                />
            </VirtualGridAutoSizerContainer>
        </ErrorBoundary>
    );
};
