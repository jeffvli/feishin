import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { PageHeader, ScrollArea, TextTitle } from '/@/renderer/components';
import { PlaylistDetailContent } from '/@/renderer/features/playlists/components/playlist-detail-content';
import { PlaylistDetailHeader } from '/@/renderer/features/playlists/components/playlist-detail-header';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { AnimatedPage, PlayButton } from '/@/renderer/features/shared';
import { useFastAverageColor } from '/@/renderer/hooks';

const PlaylistDetailRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const { playlistId } = useParams() as { playlistId: string };

  const detailsQuery = usePlaylistDetail({
    id: playlistId,
  });

  const playlistSongsQuery = usePlaylistSongList({
    id: playlistId,
    limit: 50,
    startIndex: 0,
  });

  const imageUrl = playlistSongsQuery.data?.items?.[0]?.imageUrl;
  const background = useFastAverageColor(imageUrl);
  const containerRef = useRef();

  const { ref, entry } = useIntersection({
    root: containerRef.current,
    threshold: 0.3,
  });

  return (
    <AnimatedPage key={`playlist-detail-${playlistId}`}>
      <PageHeader
        backgroundColor={background}
        isHidden={entry?.isIntersecting}
        position="absolute"
      >
        <Group noWrap>
          <PlayButton />
          <TextTitle
            fw="bold"
            order={2}
            overflow="hidden"
          >
            {detailsQuery?.data?.name}
          </TextTitle>
        </Group>
      </PageHeader>
      <ScrollArea
        ref={containerRef}
        h="100%"
        offsetScrollbars={false}
        styles={{ scrollbar: { marginTop: '35px' } }}
      >
        {background && (
          <>
            <PlaylistDetailHeader
              ref={ref}
              background={background}
              imageUrl={imageUrl || undefined}
            />
            <PlaylistDetailContent tableRef={tableRef} />
          </>
        )}
      </ScrollArea>
    </AnimatedPage>
  );
};

export default PlaylistDetailRoute;
