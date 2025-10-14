import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistDetailTopSongsListHeader } from '/@/renderer/features/artists/components/album-artist-detail-top-songs-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { useCurrentServer } from '/@/renderer/store/auth.store';
import { LibraryItem } from '/@/shared/types/domain-types';

const AlbumArtistDetailTopSongsListRoute = () => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const server = useCurrentServer();
    const pageKey = LibraryItem.SONG;

    const detailQuery = useQuery(
        artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
    );

    const topSongsQuery = useQuery(
        artistsQueries.topSongs({
            options: { enabled: !!detailQuery?.data?.name },
            query: { artist: detailQuery?.data?.name || '', artistId: routeId },
            serverId: server?.id,
        }),
    );

    const itemCount = topSongsQuery?.data?.items?.length || 0;

    const providerValue = useMemo(() => {
        return {
            id: routeId,
            pageKey,
        };
    }, [routeId, pageKey]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumArtistDetailTopSongsListHeader
                    data={topSongsQuery?.data?.items || []}
                    itemCount={itemCount}
                    title={detailQuery?.data?.name || 'Unknown'}
                />
                {/* <AlbumArtistDetailTopSongsListContent
                    data={topSongsQuery?.data?.items || []}
                    tableRef={tableRef}
                /> */}
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumArtistDetailTopSongsListRoute;
