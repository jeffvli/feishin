import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { VirtualGridContainer } from '/@/renderer/components';
import { AlbumArtistDetailTopSongsListContent } from '/@/renderer/features/artists/components/album-artist-detail-top-songs-list-content';
import { AlbumArtistDetailTopSongsListHeader } from '/@/renderer/features/artists/components/album-artist-detail-top-songs-list-header';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { useTopSongsList } from '/@/renderer/features/artists/queries/top-songs-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';

const AlbumArtistDetailTopSongsListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { albumArtistId } = useParams() as { albumArtistId: string };
  const server = useCurrentServer();

  const detailQuery = useAlbumArtistDetail({ id: albumArtistId });

  const topSongsQuery = useTopSongsList(
    { artist: detailQuery?.data?.name || '' },
    { enabled: server?.type !== ServerType.JELLYFIN && !!detailQuery?.data?.name },
  );

  const itemCount = topSongsQuery?.data?.items?.length || 0;

  if (detailQuery.isLoading || topSongsQuery?.isLoading) return null;

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumArtistDetailTopSongsListHeader
          data={topSongsQuery?.data?.items || []}
          itemCount={itemCount}
          title={detailQuery?.data?.name || 'Unknown'}
        />
        <AlbumArtistDetailTopSongsListContent
          data={topSongsQuery?.data?.items || []}
          tableRef={tableRef}
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumArtistDetailTopSongsListRoute;
