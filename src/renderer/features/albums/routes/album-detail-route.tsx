import { PageHeader, ScrollArea } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { useParams } from 'react-router';
import { useFastAverageColor } from '/@/renderer/hooks';
import { AlbumDetailContent } from '/@/renderer/features/albums/components/album-detail-content';
import { AlbumDetailHeader } from '/@/renderer/features/albums/components/album-detail-header';

const AlbumDetailRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { albumId } = useParams() as { albumId: string };
  const detailQuery = useAlbumDetail({ id: albumId });
  const background = useFastAverageColor(detailQuery.data?.imageUrl);

  return (
    <AnimatedPage key={`album-detail-${albumId}`}>
      <PageHeader
        useOpacity
        position="absolute"
      />

      <ScrollArea
        h="100%"
        offsetScrollbars={false}
        styles={{
          scrollbar: {
            marginTop: '35px',
          },
        }}
      >
        <AlbumDetailHeader background={background} />
        <AlbumDetailContent tableRef={tableRef} />
      </ScrollArea>
    </AnimatedPage>
  );
};

export default AlbumDetailRoute;
