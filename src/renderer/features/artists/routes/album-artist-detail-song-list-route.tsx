import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useSetState } from '@mantine/hooks';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { SongListSort, SortOrder } from '/@/renderer/api/types';
import { VirtualGridContainer } from '/@/renderer/components';
import { AlbumArtistDetailSongListContent } from '/@/renderer/features/artists/components/album-artist-detail-song-list-content';
import { AlbumArtistDetailSongListHeader } from '/@/renderer/features/artists/components/album-artist-detail-song-list-header';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useSongList } from '/@/renderer/features/songs';
import { SongListFilter } from '/@/renderer/store';

const AlbumArtistDetailSongListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { albumArtistId } = useParams() as { albumArtistId: string };

  const detailQuery = useAlbumArtistDetail({ id: albumArtistId });

  const [filter, setFilter] = useSetState<SongListFilter>({
    artistIds: [albumArtistId],
    sortBy: SongListSort.ALBUM,
    sortOrder: SortOrder.ASC,
  });

  const itemCountCheck = useSongList(
    {
      limit: 1,
      startIndex: 0,
      ...filter,
    },
    {
      cacheTime: 1000 * 60 * 60 * 2,
      staleTime: 1000 * 60 * 60 * 2,
    },
  );

  const itemCount =
    itemCountCheck.data?.totalRecordCount === null
      ? undefined
      : itemCountCheck.data?.totalRecordCount;

  if (detailQuery.isLoading) return null;

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumArtistDetailSongListHeader
          filter={filter}
          itemCount={itemCount}
          setFilter={setFilter}
          tableRef={tableRef}
          title={detailQuery?.data?.name || 'Unknown'}
        />
        <AlbumArtistDetailSongListContent
          filter={filter}
          itemCount={itemCount}
          tableRef={tableRef}
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumArtistDetailSongListRoute;
