import styled from '@emotion/styled';
import { Stack, Group, Grid, Accordion, Center } from '@mantine/core';
import { SpotlightProvider } from '@mantine/spotlight';
import { AnimatePresence, motion } from 'framer-motion';
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
import { Button, TextInput } from '@/renderer/components';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, usePlayerStore } from '@/renderer/store';
import { fadeIn } from '@/renderer/styles';
import { SidebarItem } from './sidebar-item';

const SidebarContainer = styled.div`
  height: 100%;
  max-height: calc(100vh - 120px); // Account for titlebar and playerbar
`;

const ImageContainer = styled(motion(Link))<{ height: string }>`
  ${fadeIn};
  position: relative;
  height: ${(props) => props.height};

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
  object-fit: contain;
`;

export const Sidebar = () => {
  const navigate = useNavigate();
  const sidebar = useAppStore((state) => state.sidebar);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const imageUrl = usePlayerStore((state) => state.current?.song?.imageUrl);

  const showImage = sidebar.image;

  return (
    <SidebarContainer>
      <Stack justify="space-between" spacing={0} sx={{ height: '100%' }}>
        <Stack
          sx={{
            maxHeight: showImage ? `calc(100% - ${sidebar.leftWidth})` : '100%',
          }}
        >
          <Grid p={10}>
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
              <Group grow spacing={5}>
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
          </Grid>
          <Stack spacing={0} sx={{ overflowY: 'auto' }}>
            <SidebarItem to={AppRoute.HOME}>
              <Group>
                <RiHome5Line size={15} />
                Home
              </Group>
            </SidebarItem>
            <SidebarItem>
              <SidebarItem.Link disabled to={AppRoute.EXPLORE}>
                <Group>
                  <RiEyeLine />
                  Explore
                </Group>
              </SidebarItem.Link>
            </SidebarItem>
            <Accordion
              disableChevronRotation
              multiple
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
                  <SidebarItem disabled to={AppRoute.LIBRARY_SONGS}>
                    <Group>
                      <RiMusicLine />
                      Tracks
                    </Group>
                  </SidebarItem>
                  <SidebarItem disabled to={AppRoute.LIBRARY_ALBUMARTISTS}>
                    <Group>
                      <RiUserVoiceLine />
                      Artists
                    </Group>
                  </SidebarItem>
                  <SidebarItem disabled to={AppRoute.LIBRARY_FOLDERS}>
                    <Group>
                      <RiFolder3Line />
                      Folders
                    </Group>
                  </SidebarItem>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="collections">
                <Accordion.Control disabled p="1rem">
                  <Group>
                    <RiPlayListLine size={20} />
                    Collections
                  </Group>
                </Accordion.Control>
                <Accordion.Panel />
              </Accordion.Item>
              <Accordion.Item value="playlists">
                <Accordion.Control disabled p="1rem">
                  <Group>
                    <RiPlayListLine size={20} />
                    Playlists
                  </Group>
                </Accordion.Control>
                <Accordion.Panel />
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Stack>
        <AnimatePresence exitBeforeEnter initial={false}>
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
                <SidebarImage src={imageUrl} />
              ) : (
                <Center
                  sx={{ background: 'var(--placeholder-bg)', height: '100%' }}
                >
                  <RiDiscLine color="var(--placeholder-fg)" size={50} />
                </Center>
              )}
              <Group
                position="right"
                sx={{ position: 'absolute', right: 0, top: 0 }}
              >
                <Button
                  compact
                  variant="subtle"
                  onClick={(e) => {
                    e.preventDefault();
                    setSidebar({ image: false });
                  }}
                >
                  <RiArrowDownSLine color="white" size={20} />
                </Button>
              </Group>
            </ImageContainer>
          )}
        </AnimatePresence>
      </Stack>
    </SidebarContainer>
  );
};
