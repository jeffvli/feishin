import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { useCurrentServer } from '/@/renderer/store/auth.store';
import { useListFilterByKey } from '/@/renderer/store/list.store';
import { AlbumArtistListQuery, LibraryItem } from '/@/shared/types/domain-types';

const AlbumArtistListRoute = () => {
    const gridRef = useRef<null>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const pageKey = LibraryItem.ALBUM_ARTIST;
    const server = useCurrentServer();

    const albumArtistListFilter = useListFilterByKey<AlbumArtistListQuery>({ key: pageKey });

    const itemCountCheck = useQuery(
        artistsQueries.albumArtistListCount({
            options: {
                gcTime: 1000 * 60,
            },
            query: albumArtistListFilter,
            serverId: server?.id,
        }),
    );

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
                {/* <AlbumArtistListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                /> */}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumArtistListRoute;
