import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { VirtualGridContainer } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { useSongListFilters } from '/@/renderer/store';

const TrackListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);

  const filters = useSongListFilters();

  const itemCountCheck = useSongList(
    {
      limit: 1,
      startIndex: 0,
      ...filters,
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

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <SongListHeader
          itemCount={itemCount}
          tableRef={tableRef}
        />
        <SongListContent
          itemCount={itemCount}
          tableRef={tableRef}
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default TrackListRoute;
