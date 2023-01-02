import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { PageHeader, ScrollArea } from '/@/renderer/components';
import { PlaylistDetailContent } from '/@/renderer/features/playlists/components/playlist-detail-content';
import { PlaylistDetailHeader } from '/@/renderer/features/playlists/components/playlist-detail-header';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useFastAverageColor, useShouldPadTitlebar } from '/@/renderer/hooks';

const PlaylistDetailRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { playlistId } = useParams() as { playlistId: string };
  const padTitlebar = useShouldPadTitlebar();

  const detailQuery = usePlaylistDetail({ id: playlistId });
  const background = useFastAverageColor(detailQuery?.data?.imageUrl, 'dominant');

  return (
    <>
      <PageHeader position="absolute" />
      {background && (
        <AnimatedPage key={`playlist-detail-${playlistId}`}>
          <ScrollArea
            h="100%"
            offsetScrollbars={false}
            styles={{ scrollbar: { marginTop: padTitlebar ? '35px' : 0 } }}
          >
            <PlaylistDetailHeader
              background={background}
              imagePlaceholderUrl={detailQuery?.data?.imageUrl}
              imageUrl={detailQuery?.data?.imageUrl}
            />
            <PlaylistDetailContent tableRef={tableRef} />
          </ScrollArea>
        </AnimatedPage>
      )}
    </>
  );
};

export default PlaylistDetailRoute;
