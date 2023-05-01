import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { generatePageKey, useAlbumArtistListFilter } from '/@/renderer/store';
import { AlbumArtistListContext } from '/@/renderer/features/artists/context/album-artist-list-context';
import { useCurrentServer } from '../../../store/auth.store';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';

const AlbumArtistListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);
  const pageKey = generatePageKey('albumArtist', undefined);
  const server = useCurrentServer();

  const albumArtistListFilter = useAlbumArtistListFilter({ id: undefined, key: pageKey });

  const itemCountCheck = useAlbumArtistList({
    options: {
      cacheTime: 1000 * 60,
      staleTime: 1000 * 60,
    },
    query: {
      limit: 1,
      startIndex: 0,
      ...albumArtistListFilter,
    },
    serverId: server?.id,
  });

  const itemCount =
    itemCountCheck.data?.totalRecordCount === null
      ? undefined
      : itemCountCheck.data?.totalRecordCount;

  return (
    <AnimatedPage>
      <AlbumArtistListContext.Provider value={{ id: undefined, pageKey }}>
        <AlbumArtistListHeader
          gridRef={gridRef}
          itemCount={itemCount}
          tableRef={tableRef}
        />
        <AlbumArtistListContent
          gridRef={gridRef}
          tableRef={tableRef}
        />
      </AlbumArtistListContext.Provider>
    </AnimatedPage>
  );
};

export default AlbumArtistListRoute;
