import { MouseEvent } from 'react';
import { Stack, Grid, Accordion, Center, Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { AnimatePresence, motion } from 'framer-motion';
import { BsCollection } from 'react-icons/bs';
import { Button, MotionStack, ScrollArea, TextInput } from '/@/renderer/components';
import { MdOutlineFeaturedPlayList, MdFeaturedPlayList } from 'react-icons/md';
import {
  RiAddFill,
  RiAlbumFill,
  RiAlbumLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDatabaseFill,
  RiDatabaseLine,
  RiDiscLine,
  RiFlag2Line,
  RiFolder3Line,
  RiHome4Fill,
  RiHome4Line,
  RiListUnordered,
  RiMusic2Fill,
  RiMusic2Line,
  RiSearchLine,
  RiUserVoiceFill,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { useNavigate, Link, useLocation, generatePath } from 'react-router-dom';
import styled from 'styled-components';
import {
  PlaylistSidebarItem,
  SidebarItem,
} from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import {
  useSidebarStore,
  useAppStoreActions,
  useCurrentSong,
  useCurrentServer,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { CreatePlaylistForm, usePlaylistList } from '/@/renderer/features/playlists';
import { LibraryItem, PlaylistListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';

const SidebarContainer = styled.div`
  height: 100%;
  max-height: calc(100vh - 85px); // Account for playerbar
  user-select: none;
`;

const ImageContainer = styled(motion(Link))<{ height: string }>`
  position: relative;
  height: ${(props) => props.height};

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

const ActionsContainer = styled(Grid)`
  -webkit-app-region: drag;
`;

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebar = useSidebarStore();
  const { setSidebar } = useAppStoreActions();
  const imageUrl = useCurrentSong()?.imageUrl;
  const server = useCurrentServer();

  const upsizedImageUrl = imageUrl
    ?.replace(/size=\d+/, 'size=300')
    .replace(/width=\d+/, 'width=300')
    .replace(/height=\d+/, 'height=300');

  const showImage = sidebar.image;
  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const handlePlayPlaylist = (id: string) => {
    handlePlayQueueAdd?.({
      byItemType: {
        id: [id],
        type: LibraryItem.PLAYLIST,
      },
      play: playButtonBehavior,
    });
  };

  const playlistsQuery = usePlaylistList({
    limit: 100,
    sortBy: PlaylistListSort.NAME,
    sortOrder: SortOrder.ASC,
    startIndex: 0,
  });

  const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    openModal({
      children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
      size: server?.type === ServerType?.NAVIDROME ? 'lg' : 'sm',
      title: 'Create Playlist',
    });
  };

  return (
    <SidebarContainer>
      <Stack
        h="100%"
        justify="space-between"
        spacing={0}
      >
        <MotionStack
          layout="position"
          spacing={0}
          sx={{ maxHeight: showImage ? `calc(100% - ${sidebar.leftWidth})` : '100%' }}
        >
          <ActionsContainer p={10}>
            <Grid.Col span={8}>
              <TextInput
                disabled
                readOnly
                icon={<RiSearchLine />}
                placeholder="Search"
                rightSectionWidth={90}
                // onClick={() => openSpotlight()}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Group
                grow
                spacing={5}
              >
                <Button
                  px={5}
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="default"
                  onClick={() => navigate(-1)}
                >
                  <RiArrowLeftSLine size={20} />
                </Button>
                <Button
                  px={5}
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="default"
                  onClick={() => navigate(1)}
                >
                  <RiArrowRightSLine size={20} />
                </Button>
              </Group>
            </Grid.Col>
          </ActionsContainer>

          <ScrollArea
            offsetScrollbars={false}
            scrollbarSize={6}
          >
            <Stack spacing={0}>
              <SidebarItem
                px="1rem"
                py="0.5rem"
                to={AppRoute.HOME}
              >
                <Group>
                  {location.pathname === AppRoute.HOME ? (
                    <RiHome4Fill size="1.3em" />
                  ) : (
                    <RiHome4Line size="1.3em" />
                  )}
                  Home
                </Group>
              </SidebarItem>
              <Accordion
                multiple
                styles={{
                  control: {
                    '&:hover': { background: 'none', color: 'var(--sidebar-fg-hover)' },
                    color: 'var(--sidebar-fg)',
                    padding: '1rem 1rem',
                    transition: 'color 0.2s ease-in-out',
                  },
                  item: { borderBottom: 'none', color: 'var(--sidebar-fg)' },
                  itemTitle: { color: 'var(--sidebar-fg)' },
                  panel: { padding: '0 1rem' },
                }}
                value={sidebar.expanded}
                onChange={(e) => setSidebar({ expanded: e })}
              >
                <Accordion.Item value="library">
                  <Accordion.Control>
                    <Group>
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
                      <Group>
                        {location.pathname === AppRoute.LIBRARY_ALBUMS ? (
                          <RiAlbumFill size="1.1em" />
                        ) : (
                          <RiAlbumLine size="1.1em" />
                        )}
                        Albums
                      </Group>
                    </SidebarItem>
                    <SidebarItem to={AppRoute.LIBRARY_SONGS}>
                      <Group>
                        {location.pathname === AppRoute.LIBRARY_SONGS ? (
                          <RiMusic2Fill size="1.1em" />
                        ) : (
                          <RiMusic2Line size="1.1em" />
                        )}
                        Tracks
                      </Group>
                    </SidebarItem>
                    <SidebarItem to={AppRoute.LIBRARY_ALBUM_ARTISTS}>
                      <Group>
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
                      <Group>
                        <RiFlag2Line size="1.1em" />
                        Genres
                      </Group>
                    </SidebarItem>
                    <SidebarItem
                      disabled
                      to={AppRoute.LIBRARY_FOLDERS}
                    >
                      <Group>
                        <RiFolder3Line size="1.1em" />
                        Folders
                      </Group>
                    </SidebarItem>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="collections">
                  <Accordion.Control disabled>
                    <Group>
                      <BsCollection size="1.3em" />
                      Collections
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel />
                </Accordion.Item>
                <Accordion.Item value="playlists">
                  <Accordion.Control>
                    <Group
                      noWrap
                      position="apart"
                    >
                      <Group noWrap>
                        {location.pathname.includes('/playlists/') ? (
                          <MdFeaturedPlayList size="1.3em" />
                        ) : (
                          <MdOutlineFeaturedPlayList size="1.3em" />
                        )}
                        Playlists
                      </Group>
                      <Group
                        noWrap
                        spacing="sm"
                      >
                        <Button
                          compact
                          component="div"
                          h="1.5em"
                          tooltip={{ label: 'Create playlist', openDelay: 500 }}
                          variant="default"
                          onClick={handleCreatePlaylistModal}
                        >
                          <RiAddFill size="1em" />
                        </Button>
                        <Button
                          compact
                          component={Link}
                          h="1.5em"
                          to={AppRoute.PLAYLISTS}
                          tooltip={{ label: 'Playlist list', openDelay: 500 }}
                          variant="default"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RiListUnordered size="1em" />
                        </Button>
                      </Group>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {playlistsQuery?.data?.items?.map((playlist) => (
                      <PlaylistSidebarItem
                        key={`sidebar-playlist-${playlist.id}`}
                        handlePlay={() => handlePlayPlaylist(playlist.id)}
                        to={generatePath(AppRoute.PLAYLISTS_DETAIL, { playlistId: playlist.id })}
                      >
                        {playlist.name}
                      </PlaylistSidebarItem>
                    ))}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </ScrollArea>
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
              to={AppRoute.NOW_PLAYING}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
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
                size="sm"
                sx={{ position: 'absolute', right: 5, top: 5 }}
                tooltip={{ label: 'Collapse', openDelay: 500 }}
                variant="default"
                onClick={(e) => {
                  e.preventDefault();
                  setSidebar({ image: false });
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
