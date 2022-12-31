import { Stack, Grid, Accordion, Center, Group } from '@mantine/core';
import { SpotlightProvider } from '@mantine/spotlight';
import { AnimatePresence, motion } from 'framer-motion';
import { BsCollection } from 'react-icons/bs';
import { Button, TextInput } from '/@/renderer/components';
import {
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
  RiMusicFill,
  RiMusicLine,
  RiPlayListLine,
  RiSearchLine,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import { useSidebarStore, useAppStoreActions, useCurrentSong } from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';

const SidebarContainer = styled.div`
  height: 100%;
  max-height: calc(100vh - 85px); // Account for and playerbar
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

  const showImage = sidebar.image;

  return (
    <SidebarContainer>
      <Stack
        justify="space-between"
        spacing={0}
        sx={{ height: '100%' }}
      >
        <Stack
          sx={{
            maxHeight: showImage ? `calc(100% - ${sidebar.leftWidth})` : '100%',
          }}
        >
          <ActionsContainer p={10}>
            <Grid.Col span={8}>
              <SpotlightProvider actions={[]}>
                <TextInput
                  disabled
                  readOnly
                  icon={<RiSearchLine />}
                  placeholder="Search"
                  rightSectionWidth={90}
                  // onClick={() => openSpotlight()}
                />
              </SpotlightProvider>
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
          <Stack
            spacing={0}
            sx={{ overflowY: 'auto' }}
          >
            <SidebarItem to={AppRoute.HOME}>
              <Group>
                {location.pathname === AppRoute.HOME ? (
                  <RiHome5Fill size={15} />
                ) : (
                  <RiHome5Line size={15} />
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
                  transition: 'color 0.2s ease-in-out',
                },
                item: { borderBottom: 'none', color: 'var(--sidebar-fg)' },
                itemTitle: { color: 'var(--sidebar-fg)' },
                panel: {
                  marginLeft: '1rem',
                },
              }}
              value={sidebar.expanded}
              onChange={(e) => setSidebar({ expanded: e })}
            >
              <Accordion.Item value="library">
                <Accordion.Control p="1rem">
                  <Group>
                    {location.pathname.includes('/library/') ? (
                      <RiDatabaseFill size={15} />
                    ) : (
                      <RiDatabaseLine size={15} />
                    )}
                    Library
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <SidebarItem to={AppRoute.LIBRARY_ALBUMS}>
                    <Group>
                      {location.pathname === AppRoute.LIBRARY_ALBUMS ? (
                        <RiAlbumFill />
                      ) : (
                        <RiAlbumLine />
                      )}
                      Albums
                    </Group>
                  </SidebarItem>
                  <SidebarItem to={AppRoute.LIBRARY_SONGS}>
                    <Group>
                      {location.pathname === AppRoute.LIBRARY_SONGS ? (
                        <RiMusicFill />
                      ) : (
                        <RiMusicLine />
                      )}
                      Tracks
                    </Group>
                  </SidebarItem>
                  <SidebarItem to={AppRoute.LIBRARY_ALBUMARTISTS}>
                    <Group>
                      <RiUserVoiceLine />
                      Album Artists
                    </Group>
                  </SidebarItem>
                  <SidebarItem
                    disabled
                    to={AppRoute.LIBRARY_FOLDERS}
                  >
                    <Group>
                      <RiFlag2Line />
                      Genres
                    </Group>
                  </SidebarItem>
                  <SidebarItem
                    disabled
                    to={AppRoute.LIBRARY_FOLDERS}
                  >
                    <Group>
                      <RiFolder3Line />
                      Folders
                    </Group>
                  </SidebarItem>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="collections">
                <Accordion.Control
                  disabled
                  p="1rem"
                >
                  <Group>
                    <BsCollection size={15} />
                    Collections
                  </Group>
                </Accordion.Control>
                <Accordion.Panel />
              </Accordion.Item>
              <Accordion.Item value="playlists">
                <Accordion.Control
                  disabled
                  p="1rem"
                >
                  <Group>
                    <RiPlayListLine size={15} />
                    Playlists
                  </Group>
                </Accordion.Control>
                <Accordion.Panel />
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Stack>
        <AnimatePresence
          initial={false}
          mode="wait"
        >
          {showImage && (
            <ImageContainer
              key="sidebar-image"
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              height={sidebar.leftWidth}
              initial={{ opacity: 0, y: 200 }}
              to={AppRoute.NOW_PLAYING}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {imageUrl ? (
                <SidebarImage
                  loading="eager"
                  src={imageUrl}
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
                tooltip={{ label: 'Collapse' }}
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
