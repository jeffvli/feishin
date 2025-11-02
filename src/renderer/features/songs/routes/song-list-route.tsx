import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQuery } from '@tanstack/react-query';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { GenreListSort, LibraryItem, SongListQuery, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const TrackListRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const { albumArtistId, genreId } = useParams();

    const pageKey = albumArtistId ? `albumArtistSong` : 'song';

    const customFilters = useMemo(() => {
        const value = {
            ...(albumArtistId && { artistIds: [albumArtistId] }),
            ...(genreId && {
                genreIds: [genreId],
            }),
        };

        if (isEmpty(value)) {
            return undefined;
        }

        return value;
    }, [albumArtistId, genreId]);

    const handlePlayQueueAdd = usePlayQueueAdd();
    const songListFilter = useListFilterByKey<SongListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const genreList = useQuery(
        genresQueries.list({
            options: {
                enabled: !!genreId,
                gcTime: 1000 * 60 * 60,
            },
            query: {
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const genreTitle = useMemo(() => {
        if (!genreList.data) return '';
        const genre = genreList.data.items.find((g) => g.id === genreId);

        if (!genre) return 'Unknown';

        return genre?.name;
    }, [genreId, genreList.data]);

    const itemCountCheck = useQuery(
        songsQueries.listCount({
            options: {
                gcTime: 1000 * 60,
            },
            query: songListFilter,
            serverId: server?.id,
        }),
    );

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { initialSongId, playType } = args;
            const query: SongListQuery = { ...songListFilter, limit: itemCount, startIndex: 0 };

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

    const providerValue = useMemo(() => {
        return {
            customFilters,
            handlePlay,
            id: albumArtistId ?? genreId,
            pageKey,
        };
    }, [albumArtistId, customFilters, genreId, handlePlay, pageKey]);

    const artist = searchParams.get('artistName');
    const title = artist ? artist : genreId ? genreTitle : undefined;

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <SongListHeader
                    genreId={genreId}
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={title}
                />
                <SongListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default TrackListRoute;
