import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LibraryItem, SongListQuery } from '/@/renderer/api/types';
import { ListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

const TrackListRoute = () => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const { albumArtistId } = useParams();
    const pageKey = albumArtistId ? `albumArtistSong` : 'song';

    const customFilters = {
        ...(albumArtistId && { artistIds: [albumArtistId] }),
    };

    const handlePlayQueueAdd = usePlayQueueAdd();
    const songListFilter = useListFilterByKey<SongListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const itemCountCheck = useSongList({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: {
            limit: 1,
            startIndex: 0,
            ...songListFilter,
        },
        serverId: server?.id,
    });

    const itemCount =
        itemCountCheck.data?.totalRecordCount === null
            ? undefined
            : itemCountCheck.data?.totalRecordCount;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { initialSongId, playType } = args;
            const query: SongListQuery = { startIndex: 0, ...songListFilter };

            if (albumArtistId) {
                handlePlayQueueAdd?.({
                    byItemType: {
                        id: [albumArtistId],
                        type: LibraryItem.ALBUM_ARTIST,
                    },
                    initialSongId,
                    playType,
                    query,
                });
            } else {
                handlePlayQueueAdd?.({
                    byItemType: {
                        id: [],
                        type: LibraryItem.SONG,
                    },
                    initialSongId,
                    playType,
                    query,
                });
            }
        },
        [albumArtistId, handlePlayQueueAdd, itemCount, songListFilter],
    );

    return (
        <AnimatedPage>
            <ListContext.Provider value={{ customFilters, handlePlay, id: albumArtistId, pageKey }}>
                <SongListHeader
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={searchParams.get('artistName') || undefined}
                />
                <SongListContent
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default TrackListRoute;
