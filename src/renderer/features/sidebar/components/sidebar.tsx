import { MouseEvent, useMemo } from 'react';
import { Box, Center, Divider, Group, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { AnimatePresence, motion } from 'framer-motion';
import { IconType } from 'react-icons';
import {
  RiAddFill,
  RiAlbumFill,
  RiAlbumLine,
  RiArrowDownSLine,
  RiDiscLine,
  RiFlag2Fill,
  RiFlagLine,
  RiFolder3Fill,
  RiFolder3Line,
  RiHome6Fill,
  RiHome6Line,
  RiListUnordered,
  RiMusic2Fill,
  RiMusic2Line,
  RiPlayLine,
  RiSearchFill,
  RiUserVoiceFill,
  RiUserVoiceLine,
  RiSearchLine,
  RiPlayFill,
  RiSettings2Line,
  RiSettings2Fill,
  RiPlayListLine,
  RiPlayListFill,
} from 'react-icons/ri';
import { generatePath, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  SidebarItemType,
  useGeneralSettings,
  useWindowSettings,
} from '../../../store/settings.store';
import { LibraryItem, PlaylistListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import { Button, MotionStack, Spinner, Tooltip } from '/@/renderer/components';
import { CreatePlaylistForm, usePlaylistList } from '/@/renderer/features/playlists';
import { ActionBar } from '/@/renderer/features/sidebar/components/action-bar';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { SidebarPlaylistList } from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import {
  useAppStoreActions,
  useCurrentServer,
  useCurrentSong,
  useFullScreenPlayerStore,
  useSetFullScreenPlayerStore,
  useSidebarStore,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { Platform } from '/@/renderer/types';

const SidebarContainer = styled.div<{ windowBarStyle: Platform }>`
  height: 100%;
  max-height: ${(props) =>
    props.windowBarStyle === Platform.WEB || props.windowBarStyle === Platform.LINUX
      ? 'calc(100vh - 149px)'
      : 'calc(100vh - 179px)'}; // Playerbar (90px), titlebar (65px), windowbar (30px)
  user-select: none;
`;

const ImageContainer = styled(motion.div)<{ height: string }>`
  position: relative;
  height: ${(props) => props.height};
  cursor: pointer;

  ${fadeIn};
  animation: fadein 0.2s ease-in-out;

  button {
    display: none;
  }

  &:hover button {
    display: block;
  }
`;

const SidebarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--placeholder-bg);
`;

const sidebarItemMap = {
  [AppRoute.HOME]: {
    activeIcon: RiHome6Fill,
    icon: RiHome6Line,
  },
  [AppRoute.LIBRARY_ALBUMS]: {
    activeIcon: RiAlbumFill,
    icon: RiAlbumLine,
  },
  [AppRoute.LIBRARY_ALBUM_ARTISTS]: {
    activeIcon: RiUserVoiceFill,
    icon: RiUserVoiceLine,
  },
  [AppRoute.PLAYLISTS]: {
    activeIcon: RiPlayListFill,
    icon: RiPlayListLine,
  },
  [AppRoute.LIBRARY_SONGS]: {
    activeIcon: RiMusic2Fill,
    icon: RiMusic2Line,
  },
  [AppRoute.LIBRARY_FOLDERS]: {
    activeIcon: RiFolder3Fill,
    icon: RiFolder3Line,
  },
  [AppRoute.LIBRARY_GENRES]: {
    activeIcon: RiFlag2Fill,
    icon: RiFlagLine,
  },
  [generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG })]: {
    activeIcon: RiSearchFill,
    icon: RiSearchLine,
  },
  [AppRoute.SETTINGS]: {
    activeIcon: RiSettings2Fill,
    icon: RiSettings2Line,
  },
  [AppRoute.NOW_PLAYING]: {
    activeIcon: RiPlayFill,
    icon: RiPlayLine,
  },
};

export const Sidebar = () => {
  const location = useLocation();
  const sidebar = useSidebarStore();
  const { setSideBar } = useAppStoreActions();
  const { windowBarStyle } = useWindowSettings();
  const { sidebarPlaylistList } = useGeneralSettings();
  const imageUrl = useCurrentSong()?.imageUrl;
  const server = useCurrentServer();

  const upsizedImageUrl = imageUrl
    ?.replace(/size=\d+/, 'size=300')
    .replace(/width=\d+/, 'width=300')
    .replace(/height=\d+/, 'height=300');

  const showImage = sidebar.image;

  const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    openModal({
      children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
      size: server?.type === ServerType?.NAVIDROME ? 'xl' : 'sm',
      title: 'Create Playlist',
    });
  };

  const playlistsQuery = usePlaylistList({
    query: {
      sortBy: PlaylistListSort.NAME,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
  const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
  const expandFullScreenPlayer = () => {
    setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
  };

  const cq = useContainerQuery({ sm: 300 });

  const { sidebarItems } = useGeneralSettings();

  const sidebarItemsWithRoute: (SidebarItemType & {
    activeIcon: IconType;
    icon: IconType;
  })[] = useMemo(() => {
    if (!sidebarItems) return [];

    const items = sidebarItems
      .filter((item) => !item.disabled)
      .map((item) => ({
        ...item,
        ...sidebarItemMap[item.route as keyof typeof sidebarItemMap],
      }));

    return items;
  }, [sidebarItems]);

  return (
    <SidebarContainer
      ref={cq.ref}
      windowBarStyle={windowBarStyle}
    >
      <ActionBar />
      <Stack
        h="100%"
        justify="space-between"
        spacing={0}
      >
        <MotionStack
          h="100%"
          layout="position"
          spacing={0}
          sx={{ maxHeight: showImage ? `calc(100% - ${sidebar.leftWidth})` : '100%' }}
        >
          <Stack spacing={0}>
            {sidebarItemsWithRoute.map((item) => (
              <SidebarItem
                key={`sidebar-${item.route}`}
                to={item.route}
              >
                <Group spacing="sm">
                  {location.pathname === item.route ? (
                    <item.activeIcon size="1.1em" />
                  ) : (
                    <item.icon size="1.1em" />
                  )}
                  {item.label}
                </Group>
              </SidebarItem>
            ))}
          </Stack>
          <Divider
            mx="1rem"
            my="0.5rem"
          />
          {sidebarPlaylistList && (
            <>
              <Group
                position="apart"
                pt="1rem"
                px="1.5rem"
              >
                <Group>
                  <Box
                    fw="600"
                    sx={{ fontSize: '1.2rem' }}
                  >
                    Playlists
                  </Box>
                  {playlistsQuery.isLoading && <Spinner />}
                </Group>
                <Group spacing="sm">
                  <Button
                    compact
                    size="md"
                    tooltip={{ label: 'Create playlist', openDelay: 500 }}
                    variant="default"
                    onClick={handleCreatePlaylistModal}
                  >
                    <RiAddFill size="1em" />
                  </Button>
                  <Button
                    compact
                    component={Link}
                    size="md"
                    to={AppRoute.PLAYLISTS}
                    tooltip={{ label: 'Playlist list', openDelay: 500 }}
                    variant="default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RiListUnordered size="1em" />
                  </Button>
                </Group>
              </Group>
              <SidebarPlaylistList data={playlistsQuery.data} />
            </>
          )}
        </MotionStack>
        <AnimatePresence
          initial={false}
          mode="popLayout"
        >
          {showImage && (
            <ImageContainer
              key="sidebar-image"
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 200 }}
              height={sidebar.leftWidth}
              initial={{ opacity: 0, y: 200 }}
              role="button"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={expandFullScreenPlayer}
            >
              <Tooltip
                label="Toggle fullscreen player"
                openDelay={500}
              >
                {upsizedImageUrl ? (
                  <SidebarImage
                    loading="eager"
                    src={upsizedImageUrl}
                  />
                ) : (
                  <Center sx={{ background: 'var(--placeholder-bg)', height: '100%' }}>
                    <RiDiscLine
                      color="var(--placeholder-fg)"
                      size={50}
                    />
                  </Center>
                )}
              </Tooltip>
              <Button
                compact
                opacity={0.8}
                radius={100}
                size="md"
                sx={{ cursor: 'default', position: 'absolute', right: 5, top: 5 }}
                tooltip={{ label: 'Collapse', openDelay: 500 }}
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  setSideBar({ image: false });
                }}
              >
                <RiArrowDownSLine
                  color="white"
                  size={20}
                />
              </Button>
            </ImageContainer>
          )}
        </AnimatePresence>
      </Stack>
    </SidebarContainer>
  );
};
