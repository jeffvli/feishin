import { UnstyledButton } from '@mantine/core';
import { motion } from 'framer-motion';
import {
  RiUserVoiceLine,
  RiMenuFill,
  RiFlag2Line,
  RiFolder3Line,
  RiPlayListLine,
  RiAlbumLine,
  RiHome6Line,
  RiMusic2Line,
  RiHome6Fill,
  RiAlbumFill,
  RiMusic2Fill,
  RiUserVoiceFill,
  RiFlag2Fill,
  RiFolder3Fill,
  RiPlayListFill,
  RiSearchLine,
  RiSearchFill,
} from 'react-icons/ri';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { DropdownMenu, ScrollArea } from '/@/renderer/components';
import { CollapsedSidebarItem } from '/@/renderer/features/sidebar/components/collapsed-sidebar-item';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { useCommandPalette, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/renderer/types';

const SidebarContainer = styled(motion.div)<{ windowBarStyle: Platform }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: ${(props) =>
    props.windowBarStyle === Platform.WEB
      ? 'calc(100vh - 149px)'
      : 'calc(100vh - 119px)'}; // Playerbar (90px), titlebar (65px), windowbar (30px)
  user-select: none;
`;

export const CollapsedSidebar = () => {
  const location = useLocation();
  const { windowBarStyle } = useWindowSettings();
  const { open } = useCommandPalette();

  return (
    <SidebarContainer windowBarStyle={windowBarStyle}>
      <ScrollArea
        scrollHideDelay={0}
        scrollbarSize={8}
      >
        <DropdownMenu position="right-start">
          <DropdownMenu.Target>
            <CollapsedSidebarItem
              activeIcon={<RiMenuFill size="25" />}
              component={UnstyledButton}
              icon={<RiMenuFill size="25" />}
              label="Menu"
            />
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <AppMenu />
          </DropdownMenu.Dropdown>
        </DropdownMenu>
        <CollapsedSidebarItem
          activeIcon={<RiSearchFill size="25" />}
          icon={<RiSearchLine size="25" />}
          label="Search"
          onClick={open}
        />
        <CollapsedSidebarItem
          active={location.pathname === AppRoute.HOME}
          activeIcon={<RiHome6Fill size="25" />}
          component={Link}
          icon={<RiHome6Line size="25" />}
          label="Home"
          to={AppRoute.HOME}
        />
        <CollapsedSidebarItem
          active={location.pathname === AppRoute.LIBRARY_ALBUMS}
          activeIcon={<RiAlbumFill size="25" />}
          component={Link}
          icon={<RiAlbumLine size="25" />}
          label="Albums"
          to={AppRoute.LIBRARY_ALBUMS}
        />
        <CollapsedSidebarItem
          active={location.pathname === AppRoute.LIBRARY_SONGS}
          activeIcon={<RiMusic2Fill size="25" />}
          component={Link}
          icon={<RiMusic2Line size="25" />}
          label="Tracks"
          to={AppRoute.LIBRARY_SONGS}
        />
        <CollapsedSidebarItem
          active={location.pathname === AppRoute.LIBRARY_ALBUM_ARTISTS}
          activeIcon={<RiUserVoiceFill size="25" />}
          component={Link}
          icon={<RiUserVoiceLine size="25" />}
          label="Artists"
          to={AppRoute.LIBRARY_ALBUM_ARTISTS}
        />
        <CollapsedSidebarItem
          disabled
          activeIcon={<RiFlag2Fill size="25" />}
          component={Link}
          icon={<RiFlag2Line size="25" />}
          label="Genres"
          to={AppRoute.LIBRARY_GENRES}
        />
        <CollapsedSidebarItem
          disabled
          activeIcon={<RiFolder3Fill size="25" />}
          component={Link}
          icon={<RiFolder3Line size="25" />}
          label="Folders"
          to={AppRoute.LIBRARY_FOLDERS}
        />
        <CollapsedSidebarItem
          active={location.pathname === AppRoute.PLAYLISTS}
          activeIcon={<RiPlayListFill size="25" />}
          component={Link}
          icon={<RiPlayListLine size="25" />}
          label="Playlists"
          to={AppRoute.PLAYLISTS}
        />
      </ScrollArea>
    </SidebarContainer>
  );
};
