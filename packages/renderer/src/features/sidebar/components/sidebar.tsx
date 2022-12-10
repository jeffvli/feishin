import { Stack, Group, Grid, Accordion, Center } from '@mantine/core';
import { SpotlightProvider } from '@mantine/spotlight';
import { AnimatePresence, motion } from 'framer-motion';
import { BsCollection } from 'react-icons/bs';
import {
  RiAlbumLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDatabaseLine,
  RiDiscLine,
  RiEyeLine,
  RiFolder3Line,
  RiHome5Line,
  RiMusicLine,
  RiPlayListLine,
  RiSearchLine,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextInput } from '/@/components';
import { AppRoute } from '/@/router/routes';
import { useAppStoreActions, useCurrentSong, useSidebarStore } from '/@/store';
import { fadeIn } from '/@/styles';
import { SidebarItem } from './sidebar-item';

const SidebarContainer = styled.div`
  height: 100%;
  max-height: calc(100vh - 90px); // Account for and playerbar
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
                <RiHome5Line size={15} />
                Home
              </Group>
            </SidebarItem>
            <SidebarItem>
              <SidebarItem.Link
                disabled
                to={AppRoute.EXPLORE}
              >
                <Group>
                  <RiEyeLine />
                  Explore
                </Group>
              </SidebarItem.Link>
            </SidebarItem>
            <Accordion
              multiple
              styles={{
                item: { borderBottom: 'none' },
                panel: {
                  borderLeft: '1px solid rgba(100,100,100,.5)',
                  marginLeft: '1.5rem',
                },
              }}
              value={sidebar.expanded}
              onChange={(e) => setSidebar({ expanded: e })}
            >
              <Accordion.Item value="library">
                <Accordion.Control p="1rem">
                  <Group>
                    <RiDatabaseLine size={15} />
                    Library
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <SidebarItem to={AppRoute.LIBRARY_ALBUMS}>
                    <Group>
                      <RiAlbumLine />
                      Albums
                    </Group>
                  </SidebarItem>
                  <SidebarItem
                    disabled
                    to={AppRoute.LIBRARY_SONGS}
                  >
                    <Group>
                      <RiMusicLine />
                      Tracks
                    </Group>
                  </SidebarItem>
                  <SidebarItem
                    disabled
                    to={AppRoute.LIBRARY_ALBUMARTISTS}
                  >
                    <Group>
                      <RiUserVoiceLine />
                      Artists
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
              <Group
                position="right"
                sx={{ position: 'absolute', right: 0, top: 0 }}
              >
                <Button
                  compact
                  size="xs"
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
              </Group>
            </ImageContainer>
          )}
        </AnimatePresence>
      </Stack>
    </SidebarContainer>
  );
};
