import { MouseEvent } from 'react';
import { Stack, Accordion, Center, Group, Divider, Box } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, MotionStack, Spinner } from '/@/renderer/components';
import {
  RiAddFill,
  RiAlbumFill,
  RiAlbumLine,
  RiArrowDownSLine,
  RiDatabaseFill,
  RiDatabaseLine,
  RiDiscLine,
  RiFlag2Line,
  RiFolder3Line,
  RiHome6Fill,
  RiHome6Line,
  RiListUnordered,
  RiMusic2Fill,
  RiMusic2Line,
  RiUserVoiceFill,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import {
  useSidebarStore,
  useAppStoreActions,
  useCurrentSong,
  useCurrentServer,
  useSetFullScreenPlayerStore,
  useFullScreenPlayerStore,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { CreatePlaylistForm, usePlaylistList } from '/@/renderer/features/playlists';
import { PlaylistListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import { SidebarPlaylistList } from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import { useContainerQuery } from '/@/renderer/hooks';
import { ActionBar } from '/@/renderer/features/sidebar/components/action-bar';
import { Platform } from '/@/renderer/types';
import { useWindowSettings } from '../../../store/settings.store';

const SidebarContainer = styled.div<{ windowBarStyle: Platform }>`
  height: 100%;
  max-height: ${(props) =>
    props.windowBarStyle === Platform.WEB
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

export const Sidebar = () => {
  const location = useLocation();
  const sidebar = useSidebarStore();
  const { setSideBar } = useAppStoreActions();
  const { windowBarStyle } = useWindowSettings();
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
            <SidebarItem
              px="1rem"
              py="0.5rem"
              to={AppRoute.HOME}
            >
              <Group spacing="sm">
                {location.pathname === AppRoute.HOME ? (
                  <RiHome6Fill size="1.3em" />
                ) : (
                  <RiHome6Line size="1.3em" />
                )}
                Home
              </Group>
            </SidebarItem>
            <Accordion
              multiple
              styles={{
                content: { padding: '0 1rem' },
                control: {
                  '&:hover': { background: 'none', color: 'var(--sidebar-fg-hover)' },
                  color: 'var(--sidebar-fg)',
                  transition: 'color 0.2s ease-in-out',
                },
                item: { borderBottom: 'none', color: 'var(--sidebar-fg)' },
                itemTitle: { color: 'var(--sidebar-fg)' },
                label: { fontWeight: 600 },
                panel: { padding: '0 1rem' },
              }}
              value={sidebar.expanded}
              onChange={(e) => setSideBar({ expanded: e })}
            >
              <Accordion.Item value="library">
                <Accordion.Control>
                  <Group spacing="sm">
                    {location.pathname.includes('/library/') ? (
                      <RiDatabaseFill size="1.3em" />
                    ) : (
                      <RiDatabaseLine size="1.3em" />
                    )}
                    Library
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <SidebarItem to={AppRoute.LIBRARY_ALBUMS}>
                    <Group spacing="sm">
                      {location.pathname === AppRoute.LIBRARY_ALBUMS ? (
                        <RiAlbumFill size="1.1em" />
                      ) : (
                        <RiAlbumLine size="1.1em" />
                      )}
                      Albums
                    </Group>
                  </SidebarItem>
                  <SidebarItem to={AppRoute.LIBRARY_SONGS}>
                    <Group spacing="sm">
                      {location.pathname === AppRoute.LIBRARY_SONGS ? (
                        <RiMusic2Fill size="1.1em" />
                      ) : (
                        <RiMusic2Line size="1.1em" />
                      )}
                      Tracks
                    </Group>
                  </SidebarItem>
                  <SidebarItem to={AppRoute.LIBRARY_ALBUM_ARTISTS}>
                    <Group spacing="sm">
                      {location.pathname === AppRoute.LIBRARY_ALBUM_ARTISTS ? (
                        <RiUserVoiceFill size="1.1em" />
                      ) : (
                        <RiUserVoiceLine size="1.1em" />
                      )}
                      Album Artists
                    </Group>
                  </SidebarItem>
                  <SidebarItem
                    disabled
                    to={AppRoute.LIBRARY_FOLDERS}
                  >
                    <Group spacing="sm">
                      <RiFlag2Line size="1.1em" />
                      Genres
                    </Group>
                  </SidebarItem>
                  <SidebarItem
                    disabled
                    to={AppRoute.LIBRARY_FOLDERS}
                  >
                    <Group spacing="sm">
                      <RiFolder3Line size="1.1em" />
                      Folders
                    </Group>
                  </SidebarItem>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
          <Divider
            mx="1rem"
            my="0.5rem"
          />
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
