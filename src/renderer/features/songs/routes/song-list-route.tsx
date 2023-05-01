import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { SongListContext } from '/@/renderer/features/songs/context/song-list-context';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { generatePageKey, useCurrentServer, useSongListFilter } from '/@/renderer/store';

const TrackListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const server = useCurrentServer();
  const [searchParams] = useSearchParams();
  const { albumArtistId } = useParams();
  const pageKey = generatePageKey(
    'song',
    albumArtistId ? `${albumArtistId}_${server?.id}` : undefined,
  );

  const songListFilter = useSongListFilter({ id: albumArtistId, key: pageKey });
  const itemCountCheck = useSongList({
    options: {
      cacheTime: 1000 * 60,
      staleTime: 1000 * 60,
    },
    query: {
      limit: 1,
      startIndex: 0,
      ...songListFilter,
    },
    serverId: server?.id,
  });

  const itemCount =
    itemCountCheck.data?.totalRecordCount === null
      ? undefined
      : itemCountCheck.data?.totalRecordCount;

  return (
    <AnimatedPage>
      <SongListContext.Provider value={{ id: albumArtistId, pageKey }}>
        <SongListHeader
          itemCount={itemCount}
          tableRef={tableRef}
          title={searchParams.get('artistName') || undefined}
        />
        <SongListContent
          itemCount={itemCount}
          tableRef={tableRef}
        />
      </SongListContext.Provider>
    </AnimatedPage>
  );
};

export default TrackListRoute;
