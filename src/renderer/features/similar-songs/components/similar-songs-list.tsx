import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '/@/renderer/features/action-required/components/error-fallback';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Song } from '/@/shared/types/domain-types';

export type SimilarSongsListProps = {
    count?: number;
    fullScreen?: boolean;
    song: Song;
};

export const SimilarSongsList = ({ count, fullScreen, song }: SimilarSongsListProps) => {
    const tableRef = useRef<AgGridReact<Song> | null>(null);
    // const tableConfig = useTableSettings(fullScreen ? 'fullScreen' : 'songs');

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
            serverId: song?._serverId,
        }),
    );

    // const columnDefs = useMemo(
    //     () => getColumnDefs(tableConfig.columns, false, 'generic'),
    //     [tableConfig.columns],
    // );

    // const onCellContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<Song>) => {
        if (!e.data || !songQuery.data) return;

        // handlePlayQueueAdd?.({
        //     byData: songQuery.data,
        //     initialSongId: e.data.id,
        //     playType: playButtonBehavior,
        // });
    };

    return songQuery.isLoading ? (
        <Spinner container size={25} />
    ) : (
        <ErrorBoundary FallbackComponent={ErrorFallback}></ErrorBoundary>
    );
};
