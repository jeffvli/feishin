import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useMemo, useRef } from 'react';
import { useParams } from 'react-router';
import { PlaylistListSort, PlaylistSongListQuery, SortOrder } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { PlaylistListContent } from '/@/renderer/features/playlists/components/playlist-list-content';
import { PlaylistListHeader } from '/@/renderer/features/playlists/components/playlist-list-header';
import { usePlaylistList } from '/@/renderer/features/playlists/queries/playlist-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer, useListStoreByKey } from '/@/renderer/store';

const PlaylistListRoute = () => {
    const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const { playlistId } = useParams();
    const pageKey = 'playlist';
    const { filter } = useListStoreByKey<PlaylistSongListQuery>({ key: pageKey });

    const itemCountCheck = usePlaylistList({
        options: {
            cacheTime: 1000 * 60 * 60 * 2,
            staleTime: 1000 * 60 * 60 * 2,
        },
        query: {
            ...filter,
            limit: 1,
            sortBy: PlaylistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const itemCount =
        itemCountCheck.data?.totalRecordCount === null
            ? undefined
            : itemCountCheck.data?.totalRecordCount;

    const providerValue = useMemo(() => {
        return {
            id: playlistId,
            pageKey,
        };
    }, [playlistId]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <PlaylistListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
                <PlaylistListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default PlaylistListRoute;
