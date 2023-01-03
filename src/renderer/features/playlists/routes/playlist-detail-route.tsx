import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { NativeScrollArea } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { PlaylistDetailContent } from '/@/renderer/features/playlists/components/playlist-detail-content';
import { PlaylistDetailHeader } from '/@/renderer/features/playlists/components/playlist-detail-header';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useFastAverageColor } from '/@/renderer/hooks';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/renderer/types';

const PlaylistDetailRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { playlistId } = useParams() as { playlistId: string };

  const detailQuery = usePlaylistDetail({ id: playlistId });
  const background = useFastAverageColor(
    detailQuery?.data?.imageUrl,
    !detailQuery?.isLoading,
    'dominant',
  );

  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const handlePlay = () => {
    handlePlayQueueAdd?.({
      byItemType: {
        id: [playlistId],
        type: LibraryItem.PLAYLIST,
      },
      play: playButtonBehavior,
    });
  };

  if (!background) return null;

  return (
    <AnimatedPage key={`playlist-detail-${playlistId}`}>
      <NativeScrollArea
        ref={scrollAreaRef}
        pageHeaderProps={{
          backgroundColor: background,
          children: (
            <LibraryHeaderBar>
              <LibraryHeaderBar.PlayButton onClick={handlePlay} />
              <LibraryHeaderBar.Title>{detailQuery?.data?.name}</LibraryHeaderBar.Title>
            </LibraryHeaderBar>
          ),
          target: headerRef,
        }}
      >
        <PlaylistDetailHeader
          ref={headerRef}
          background={background}
          imagePlaceholderUrl={detailQuery?.data?.imageUrl}
          imageUrl={detailQuery?.data?.imageUrl}
        />
        <PlaylistDetailContent tableRef={tableRef} />
      </NativeScrollArea>
    </AnimatedPage>
  );
};

export default PlaylistDetailRoute;
