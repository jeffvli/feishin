import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { VirtualGridContainer } from '/@/renderer/components';
import { PlaylistDetailSongListContent } from '../components/playlist-detail-song-list-content';
import { PlaylistDetailSongListHeader } from '../components/playlist-detail-song-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';

const PlaylistDetailSongListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { playlistId } = useParams() as { playlistId: string };

  return (
    <AnimatedPage key={`playlist-detail-songList-${playlistId}`}>
      <VirtualGridContainer>
        <PlaylistDetailSongListHeader tableRef={tableRef} />
        <PlaylistDetailSongListContent tableRef={tableRef} />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default PlaylistDetailSongListRoute;
