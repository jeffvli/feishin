import { useMemo } from 'react';
import styled from '@emotion/styled';
import { Stack, Group, Grid, Accordion } from '@mantine/core';
import { SpotlightProvider, openSpotlight } from '@mantine/spotlight';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RiAlbumLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDatabaseLine,
  RiEyeLine,
  RiFolder3Line,
  RiHome5Line,
  RiMusicLine,
  RiPlayListLine,
  RiSearchLine,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { Button, TextInput } from '@/renderer/components';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, usePlayerStore } from '@/renderer/store';
import { SidebarItem } from './sidebar-item';

const SidebarContainer = styled.div`
  height: 100%;
  max-height: calc(100vh - 120px); // Account for titlebar and playerbar
`;

const Image = styled(motion.div)<{ height: string; url: string }>`
  height: ${(props) => props.height};
  background-image: ${(props) => `url(${props.url})`};
  background-repeat: no-repeat;
  background-size: cover;
  transition: background-image 0.5s linear 0.2s;

  button {
    display: none;
  }

  &:hover button {
    display: block;
  }
`;

export const Sidebar = () => {
  const navigate = useNavigate();
  const playerData = usePlayerStore((state) => state.getPlayerData());
  const sidebar = useAppStore((state) => state.sidebar);
  const setSidebar = useAppStore((state) => state.setSidebar);

  const showImage = sidebar.image;

  const backgroundImage = useMemo(() => {
    return playerData.current.song.imageUrl;
  }, [playerData]);

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
                  readOnly
                  icon={<RiSearchLine />}
                  placeholder="Search"
                  rightSectionWidth={90}
                  onClick={() => openSpotlight()}
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
            <Accordion disableChevronRotation multiple>
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
        <AnimatePresence>
          {showImage && (
            <Image
              key="sidebar-image"
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              height={sidebar.leftWidth}
              initial={{ opacity: 0, y: 200 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              url={backgroundImage}
            >
              <Group position="right">
                <Button
                  compact
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebar({ image: false });
                  }}
                >
                  <RiArrowDownSLine color="white" size={20} />
                </Button>
              </Group>
            </Image>
          )}
        </AnimatePresence>
      </Stack>
    </SidebarContainer>
  );
};
