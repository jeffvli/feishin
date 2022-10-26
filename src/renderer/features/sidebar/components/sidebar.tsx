import styled from '@emotion/styled';
import { Stack, Group, Grid, Accordion } from '@mantine/core';
import { SpotlightProvider, openSpotlight } from '@mantine/spotlight';
import {
  RiAlbumLine,
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
import { AppRoute } from '../../../router/routes';
import { SidebarItem } from './sidebar-item';

const StyledSidebar = styled.div``;

export const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <StyledSidebar>
      <Stack p={10}>
        <Grid>
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
      </Stack>
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
    </StyledSidebar>
  );
};
