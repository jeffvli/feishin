import { Group } from '@mantine/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { RiAddBoxFill, RiAddCircleFill, RiPlayFill } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import { LibraryItem } from '/@/renderer/api/types';
import { Button, NativeScrollArea, Text } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistList } from '/@/renderer/features/playlists';
import { AppRoute } from '/@/renderer/router/routes';
import { Play } from '/@/renderer/types';

interface SidebarPlaylistListProps {
  data: ReturnType<typeof usePlaylistList>['data'];
}

export const SidebarPlaylistList = ({ data }: SidebarPlaylistListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const handlePlayQueueAdd = usePlayQueueAdd();

  const handlePlayPlaylist = (id: string, play: Play) => {
    handlePlayQueueAdd?.({
      byItemType: {
        id: [id],
        type: LibraryItem.PLAYLIST,
      },
      play,
    });
  };

  const rowVirtualizer = useVirtualizer({
    count: data?.items?.length || 0,
    estimateSize: () => 25,
    getScrollElement: () => {
      return scrollAreaRef.current;
    },
    overscan: 5,
  });

  return (
    <NativeScrollArea
      ref={scrollAreaRef}
      scrollBarOffset="0px"
      scrollHideDelay={0}
      style={{ margin: '0.5rem 0', padding: '0 1rem' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
          width: '100%',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              height: `${virtualRow.size}px`,
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
            }}
          >
            <Group
              noWrap
              className="sidebar-playlist-item"
              pl="1rem"
              pos="relative"
              position="apart"
              sx={{
                '&:hover': {
                  '.sidebar-playlist-controls': {
                    display: 'flex',
                  },
                  '.sidebar-playlist-name': {
                    color: 'var(--sidebar-fg-hover) !important',
                  },
                },
              }}
            >
              <Text
                className="sidebar-playlist-name"
                component={Link}
                overflow="hidden"
                size="md"
                sx={{
                  color: 'var(--sidebar-fg) !important',
                  cursor: 'default',
                  width: '100%',
                }}
                to={
                  data?.items?.[virtualRow.index].id
                    ? generatePath(AppRoute.PLAYLISTS_DETAIL, {
                        playlistId: data?.items?.[virtualRow.index].id,
                      })
                    : undefined
                }
              >
                {data?.items?.[virtualRow.index].name}
              </Text>
              <Group
                noWrap
                className="sidebar-playlist-controls"
                display="none"
                pos="absolute"
                right="0"
                spacing="sm"
              >
                <Button
                  compact
                  size="md"
                  tooltip={{ label: 'Play', openDelay: 500 }}
                  variant="default"
                  onClick={() => {
                    if (!data?.items?.[virtualRow.index].id) return;
                    handlePlayPlaylist(data?.items?.[virtualRow.index].id, Play.NOW);
                  }}
                >
                  <RiPlayFill />
                </Button>
                <Button
                  compact
                  size="md"
                  tooltip={{ label: 'Add to queue', openDelay: 500 }}
                  variant="default"
                  onClick={() => {
                    if (!data?.items?.[virtualRow.index].id) return;
                    handlePlayPlaylist(data?.items?.[virtualRow.index].id, Play.LAST);
                  }}
                >
                  <RiAddBoxFill />
                </Button>
                <Button
                  compact
                  size="md"
                  tooltip={{ label: 'Add to queue next', openDelay: 500 }}
                  variant="default"
                  onClick={() => {
                    if (!data?.items?.[virtualRow.index].id) return;
                    handlePlayPlaylist(data?.items?.[virtualRow.index].id, Play.NEXT);
                  }}
                >
                  <RiAddCircleFill />
                </Button>
              </Group>
            </Group>
          </div>
        ))}
      </div>
    </NativeScrollArea>
  );
};
