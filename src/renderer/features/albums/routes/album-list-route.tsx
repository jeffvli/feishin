import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

const AlbumListRoute = () => {
    const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const { albumArtistId } = useParams();
    const pageKey = albumArtistId ? `albumArtistAlbum` : 'album';
    const handlePlayQueueAdd = usePlayQueueAdd();

    const customFilters = useMemo(() => {
        return {
            ...(albumArtistId && { artistIds: [albumArtistId] }),
        };
    }, [albumArtistId]);

    const albumListFilter = useListFilterByKey({
        filter: customFilters,
        key: pageKey,
    });

    const itemCountCheck = useAlbumList({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: {
            limit: 1,
            startIndex: 0,
            ...albumListFilter,
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
            const { playType } = args;
            const query = {
                startIndex: 0,
                ...albumListFilter,
                ...customFilters,
            };
            const queryKey = queryKeys.albums.list(server?.id || '', query);

            const albumListRes = await queryClient.fetchQuery({
                queryFn: ({ signal }) => {
                    return api.controller.getAlbumList({
                        apiClientProps: { server, signal },
                        query,
                    });
                },
                queryKey,
            });

            const albumIds = albumListRes?.items?.map((a) => a.id) || [];

            handlePlayQueueAdd?.({
                byItemType: {
                    id: albumIds,
                    type: LibraryItem.ALBUM,
                },
                playType,
            });
        },
        [albumListFilter, customFilters, handlePlayQueueAdd, itemCount, server],
    );

    return (
        <AnimatedPage>
            <ListContext.Provider value={{ customFilters, handlePlay, id: albumArtistId, pageKey }}>
                <AlbumListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={searchParams.get('artistName') || undefined}
                />
                <AlbumListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumListRoute;
