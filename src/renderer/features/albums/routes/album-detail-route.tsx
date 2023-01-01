import { PageHeader, ScrollArea, TextTitle } from '/@/renderer/components';
import { AnimatedPage, PlayButton } from '/@/renderer/features/shared';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { useParams } from 'react-router';
import { useFastAverageColor, useShouldPadTitlebar } from '/@/renderer/hooks';
import { AlbumDetailContent } from '/@/renderer/features/albums/components/album-detail-content';
import { AlbumDetailHeader } from '/@/renderer/features/albums/components/album-detail-header';
import { useIntersection } from '@mantine/hooks';
import { Group } from '@mantine/core';

const AlbumDetailRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { albumId } = useParams() as { albumId: string };
  const detailQuery = useAlbumDetail({ id: albumId });
  const background = useFastAverageColor(detailQuery.data?.imageUrl);
  const padTop = useShouldPadTitlebar();

  const containerRef = useRef();
  const { ref, entry } = useIntersection({
    root: containerRef.current,
    threshold: 0,
  });

  return (
    <AnimatedPage key={`album-detail-${albumId}`}>
      <PageHeader
        backgroundColor="black"
        isHidden={entry?.isIntersecting}
        position="absolute"
      >
        <Group p="1rem">
          <PlayButton
            h={40}
            w={40}
          />
          <TextTitle
            fw="bold"
            order={2}
          >
            {detailQuery?.data?.name}
          </TextTitle>
        </Group>
      </PageHeader>

      <ScrollArea
        ref={containerRef}
        h="100%"
        offsetScrollbars={false}
        styles={{ scrollbar: { marginTop: padTop ? '35px' : 0 } }}
      >
        {background && (
          <>
            <AlbumDetailHeader
              ref={ref}
              background={background}
            />
            <AlbumDetailContent tableRef={tableRef} />
          </>
        )}
      </ScrollArea>
    </AnimatedPage>
  );
};

export default AlbumDetailRoute;
