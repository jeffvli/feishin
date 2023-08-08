import { useMemo, useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useParams } from 'react-router';
import { AlbumArtistDetailTopSongsListContent } from '/@/renderer/features/artists/components/album-artist-detail-top-songs-list-content';
import { AlbumArtistDetailTopSongsListHeader } from '/@/renderer/features/artists/components/album-artist-detail-top-songs-list-header';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { useTopSongsList } from '/@/renderer/features/artists/queries/top-songs-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { LibraryItem } from '../../../api/types';
import { useCurrentServer } from '../../../store/auth.store';
import { ListContext } from '/@/renderer/context/list-context';

const AlbumArtistDetailTopSongsListRoute = () => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const { albumArtistId } = useParams() as { albumArtistId: string };
    const server = useCurrentServer();
    const pageKey = LibraryItem.SONG;

    const detailQuery = useAlbumArtistDetail({
        query: { id: albumArtistId },
        serverId: server?.id,
    });

    const topSongsQuery = useTopSongsList({
        options: { enabled: !!detailQuery?.data?.name },
        query: { artist: detailQuery?.data?.name || '', artistId: albumArtistId },
        serverId: server?.id,
    });

    const itemCount = topSongsQuery?.data?.items?.length || 0;

    const providerValue = useMemo(() => {
        return {
            id: albumArtistId,
            pageKey,
        };
    }, [albumArtistId, pageKey]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <AlbumArtistDetailTopSongsListHeader
                    data={topSongsQuery?.data?.items || []}
                    itemCount={itemCount}
                    title={detailQuery?.data?.name || 'Unknown'}
                />
                <AlbumArtistDetailTopSongsListContent
                    data={topSongsQuery?.data?.items || []}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default AlbumArtistDetailTopSongsListRoute;
