import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useCallback, useMemo, useRef } from 'react';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { GenreListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { GenreListContent } from '/@/renderer/features/genres/components/genre-list-content';
import { GenreListHeader } from '/@/renderer/features/genres/components/genre-list-header';
import { useGenreList } from '/@/renderer/features/genres/queries/genre-list-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

const GenreListRoute = () => {
    const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const pageKey = 'genre';

    const itemCountCheck = useGenreList({
        query: {
            limit: 1,
            sortBy: GenreListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
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
        [handlePlayQueueAdd, itemCount, server],
    );

    const providerValue = useMemo(() => {
        return {
            handlePlay,
            pageKey,
        };
    }, [handlePlay]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <GenreListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
                <GenreListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default GenreListRoute;
