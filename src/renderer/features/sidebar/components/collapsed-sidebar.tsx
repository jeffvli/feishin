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
import { NavLink } from 'react-router-dom';
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
    props.windowBarStyle === Platform.WEB || props.windowBarStyle === Platform.LINUX
      ? 'calc(100vh - 149px)'
      : 'calc(100vh - 119px)'}; // Playerbar (90px), titlebar (65px), windowbar (30px)
  user-select: none;
`;

export const CollapsedSidebar = () => {
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
          activeIcon={<RiHome6Fill size="25" />}
          component={NavLink}
          icon={<RiHome6Line size="25" />}
          label="Home"
          route={AppRoute.HOME}
          to={AppRoute.HOME}
        />
        <CollapsedSidebarItem
          activeIcon={<RiAlbumFill size="25" />}
          component={NavLink}
          icon={<RiAlbumLine size="25" />}
          label="Albums"
          route={AppRoute.LIBRARY_ALBUMS}
          to={AppRoute.LIBRARY_ALBUMS}
        />
        <CollapsedSidebarItem
          activeIcon={<RiMusic2Fill size="25" />}
          component={NavLink}
          icon={<RiMusic2Line size="25" />}
          label="Tracks"
          route={AppRoute.LIBRARY_SONGS}
          to={AppRoute.LIBRARY_SONGS}
        />
        <CollapsedSidebarItem
          activeIcon={<RiUserVoiceFill size="25" />}
          component={NavLink}
          icon={<RiUserVoiceLine size="25" />}
          label="Artists"
          route={AppRoute.LIBRARY_ALBUM_ARTISTS}
          to={AppRoute.LIBRARY_ALBUM_ARTISTS}
        />
        <CollapsedSidebarItem
          disabled
          activeIcon={<RiFlag2Fill size="25" />}
          component={NavLink}
          icon={<RiFlag2Line size="25" />}
          label="Genres"
          to={AppRoute.LIBRARY_GENRES}
        />
        <CollapsedSidebarItem
          disabled
          activeIcon={<RiFolder3Fill size="25" />}
          component={NavLink}
          icon={<RiFolder3Line size="25" />}
          label="Folders"
          to={AppRoute.LIBRARY_FOLDERS}
        />
        <CollapsedSidebarItem
          activeIcon={<RiPlayListFill size="25" />}
          component={NavLink}
          icon={<RiPlayListLine size="25" />}
          label="Playlists"
          route={AppRoute.PLAYLISTS}
          to={AppRoute.PLAYLISTS}
        />
      </ScrollArea>
    </SidebarContainer>
  );
};
