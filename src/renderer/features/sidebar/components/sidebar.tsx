import { MouseEvent } from 'react';
import { Stack, Grid, Accordion, Center, Group, Divider, Box, Flex } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  DropdownMenu,
  MotionStack,
  Spinner,
  TextInput,
  TextTitle,
} from '/@/renderer/components';
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
  RiHome5Fill,
  RiHome5Line,
  RiListUnordered,
  RiMenuFill,
  RiMusic2Fill,
  RiMusic2Line,
  RiSearchLine,
  RiUserVoiceFill,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import {
  useSidebarStore,
  useAppStoreActions,
  useCurrentSong,
  useCurrentServer,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { CreatePlaylistForm, usePlaylistList } from '/@/renderer/features/playlists';
import { PlaylistListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import { SidebarPlaylistList } from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';

const SidebarContainer = styled.div`
  height: 100%;
  max-height: calc(100vh - 155px); // Account for playerbar (90px) and titlebar (65px)
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

  const handleCreatePlaylistModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    openModal({
      children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
      size: server?.type === ServerType?.NAVIDROME ? 'lg' : 'sm',
      title: 'Create Playlist',
    });
  };

  const playlistsQuery = usePlaylistList({
    sortBy: PlaylistListSort.NAME,
    sortOrder: SortOrder.ASC,
    startIndex: 0,
  });

  return (
    <SidebarContainer>
      <Flex
        align="center"
        className="sidebar-header"
        gap="0.5rem"
        h="65px"
        px="1rem"
        py="0.5rem"
        sx={{ '-webkit-app-region': 'drag' }}
      >
        <DropdownMenu position="bottom-start">
          <DropdownMenu.Target>
            <Button
              p="0.5rem"
              size="md"
              variant="subtle"
            >
              <RiMenuFill size="2rem" />
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <AppMenu />
          </DropdownMenu.Dropdown>
        </DropdownMenu>

        <TextTitle
          fw="900"
          order={1}
        >
          Feishin
        </TextTitle>
      </Flex>
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
          <ActionsContainer
            gutter="sm"
            p={10}
          >
            <Grid.Col span={8}>
              <TextInput
                disabled
                readOnly
                icon={<RiSearchLine />}
                placeholder="Search"
                rightSectionWidth={90}
                size="md"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Group
                grow
                spacing="sm"
              >
                <Button
                  px={5}
                  size="md"
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="default"
                  onClick={() => navigate(-1)}
                >
                  <RiArrowLeftSLine size={20} />
                </Button>
                <Button
                  px={5}
                  size="md"
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="default"
                  onClick={() => navigate(1)}
                >
                  <RiArrowRightSLine size={20} />
                </Button>
              </Group>
            </Grid.Col>
          </ActionsContainer>
          <Stack spacing={0}>
            <SidebarItem
              px="1rem"
              py="0.5rem"
              to={AppRoute.HOME}
            >
              <Group spacing="sm">
                {location.pathname === AppRoute.HOME ? (
                  <RiHome5Fill size="1.3em" />
                ) : (
                  <RiHome5Line size="1.3em" />
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
                  padding: '1rem 1rem',
                  transition: 'color 0.2s ease-in-out',
                },
                item: { borderBottom: 'none', color: 'var(--sidebar-fg)' },
                itemTitle: { color: 'var(--sidebar-fg)' },
                label: { fontWeight: 600 },
                panel: { padding: '0 1rem' },
              }}
              value={sidebar.expanded}
              onChange={(e) => setSidebar({ expanded: e })}
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
          <Divider my="0.5rem" />
          <Group
            position="apart"
            pt="1rem"
            px="1rem"
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
                size="md"
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
