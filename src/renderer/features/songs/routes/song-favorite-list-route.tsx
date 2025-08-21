import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSongListCount } from '/@/renderer/features/songs/queries/song-list-count-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { LibraryItem, SongListQuery } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const TrackFavoriteListRoute = () => {
    const { t } = useTranslation();
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();

    const pageKey = 'favorite';

    const customFilters = { favorite: true };

    const handlePlayQueueAdd = usePlayQueueAdd();
    const songListFilter = useListFilterByKey<SongListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const itemCountCheck = useSongListCount({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: songListFilter,
        serverId: server?.id,
    });

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { initialSongId, playType } = args;
            const query: SongListQuery = { ...songListFilter, limit: itemCount, startIndex: 0 };
            
            handlePlayQueueAdd?.({
                byItemType: {
                    id: [],
                    type: LibraryItem.SONG,
                },
                initialSongId,
                playType,
                query,
            });
        },
        [handlePlayQueueAdd, itemCount, songListFilter],
    );

    const providerValue = useMemo(() => {
        return {
            customFilters,
            handlePlay,
            id: undefined,
            pageKey,
        };
    }, [customFilters, handlePlay, pageKey]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <SongListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={t('page.favoriteList.title', { postProcess: 'titleCase' })}
                />
                <SongListContent gridRef={gridRef} itemCount={itemCount} tableRef={tableRef} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default TrackFavoriteListRoute;