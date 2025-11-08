import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    AlbumListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const AlbumListRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const { albumArtistId, genreId } = useParams();
    const pageKey = albumArtistId ? `albumArtistAlbum` : 'album';
    const handlePlayQueueAdd = usePlayQueueAdd();

    const customFilters = useMemo(() => {
        const value = {
            ...(albumArtistId && { artistIds: [albumArtistId] }),
            ...(genreId && {
                genres: [genreId],
            }),
        };

        if (isEmpty(value)) {
            return undefined;
        }

        return value;
    }, [albumArtistId, genreId]);

    const albumListFilter = useListFilterByKey<AlbumListQuery>({
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
        albumQueries.listCount({
            options: {
                gcTime: 1000 * 60,
                staleTime: 1000 * 60,
            },
            query: {
                ...albumListFilter,
            },
            serverId: server?.id,
        }),
    );

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            const albumsFromGrid = compact(gridRef.current?.getItemData());
            if (!itemCount || itemCount === 0 || albumsFromGrid.length === 0) return;
            const { playType } = args;

            handlePlayQueueAdd?.({
                byItemType: {
                    id: albumsFromGrid.map((a) => a.id),
                    type: LibraryItem.ALBUM,
                },
                playType,
            });
        },
        [handlePlayQueueAdd, itemCount],
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
                <AlbumListHeader
                    genreId={genreId}
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={title}
                />
                <AlbumListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumListRoute;
