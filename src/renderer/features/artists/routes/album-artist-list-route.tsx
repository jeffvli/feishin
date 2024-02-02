import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useMemo, useRef } from 'react';
import { useCurrentServer } from '../../../store/auth.store';
import { useListFilterByKey } from '../../../store/list.store';
import { LibraryItem } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { useAlbumArtistListCount } from '/@/renderer/features/artists/queries/album-artist-list-count-query';
import { AnimatedPage } from '/@/renderer/features/shared';

const AlbumArtistListRoute = () => {
    const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const pageKey = LibraryItem.ALBUM_ARTIST;
    const server = useCurrentServer();

    const albumArtistListFilter = useListFilterByKey({ key: pageKey });

    const itemCountCheck = useAlbumArtistListCount({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: {
            ...albumArtistListFilter,
        },
        serverId: server?.id,
    });

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const providerValue = useMemo(() => {
        return {
            id: undefined,
            pageKey,
        };
    }, [pageKey]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumArtistListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
                <AlbumArtistListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumArtistListRoute;
