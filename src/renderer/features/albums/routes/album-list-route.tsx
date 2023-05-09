import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { generatePageKey, useAlbumListFilter, useCurrentServer } from '/@/renderer/store';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlbumListContext } from '/@/renderer/features/albums/context/album-list-context';

const AlbumListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);
  const server = useCurrentServer();

  const [searchParams] = useSearchParams();
  const { albumArtistId } = useParams();

  const pageKey = generatePageKey(
    'album',
    albumArtistId ? `${albumArtistId}_${server?.id}` : undefined,
  );

  const albumListFilter = useAlbumListFilter({ id: albumArtistId || undefined, key: pageKey });

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

  return (
    <AnimatedPage>
      <AlbumListContext.Provider value={{ id: albumArtistId || undefined, pageKey }}>
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
      </AlbumListContext.Provider>
    </AnimatedPage>
  );
};

export default AlbumListRoute;
