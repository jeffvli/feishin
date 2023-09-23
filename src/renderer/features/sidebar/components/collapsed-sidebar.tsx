import { Group, UnstyledButton } from '@mantine/core';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { IconType } from 'react-icons';
import {
    RiUserVoiceLine,
    RiMenuFill,
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
    RiPlayFill,
    RiPlayLine,
    RiSettings2Fill,
    RiSettings2Line,
    RiFlag2Line,
    RiArrowLeftSLine,
    RiArrowRightSLine,
} from 'react-icons/ri';
import { generatePath, NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LibraryItem } from '/@/renderer/api/types';
import { DropdownMenu, ScrollArea } from '/@/renderer/components';
import { CollapsedSidebarItem } from '/@/renderer/features/sidebar/components/collapsed-sidebar-item';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { SidebarItemType, useGeneralSettings, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/renderer/types';
import { CollapsedSidebarButton } from '/@/renderer/features/sidebar/components/collapsed-sidebar-button';

const SidebarContainer = styled(motion.div)<{ $windowBarStyle: Platform }>`
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: ${(props) =>
        props.$windowBarStyle === Platform.WEB || props.$windowBarStyle === Platform.LINUX
            ? 'calc(100vh - 149px)'
            : 'calc(100vh - 119px)'};
    user-select: none;
`;

const sidebarItemMap = {
    [AppRoute.HOME]: {
        activeIcon: RiHome6Fill,
        icon: RiHome6Line,
    },
    [AppRoute.LIBRARY_ALBUMS]: {
        activeIcon: RiAlbumFill,
        icon: RiAlbumLine,
    },
    [AppRoute.LIBRARY_ALBUM_ARTISTS]: {
        activeIcon: RiUserVoiceFill,
        icon: RiUserVoiceLine,
    },
    [AppRoute.PLAYLISTS]: {
        activeIcon: RiPlayListFill,
        icon: RiPlayListLine,
    },
    [AppRoute.LIBRARY_SONGS]: {
        activeIcon: RiMusic2Fill,
        icon: RiMusic2Line,
    },
    [AppRoute.LIBRARY_FOLDERS]: {
        activeIcon: RiFolder3Fill,
        icon: RiFolder3Line,
    },
    [AppRoute.LIBRARY_GENRES]: {
        activeIcon: RiFlag2Fill,
        icon: RiFlag2Line,
    },
    [generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG })]: {
        activeIcon: RiSearchFill,
        icon: RiSearchLine,
    },
    [AppRoute.SETTINGS]: {
        activeIcon: RiSettings2Fill,
        icon: RiSettings2Line,
    },
    [AppRoute.NOW_PLAYING]: {
        activeIcon: RiPlayFill,
        icon: RiPlayLine,
    },
};

export const CollapsedSidebar = () => {
    const navigate = useNavigate();
    const { windowBarStyle } = useWindowSettings();
    const { sidebarItems, sidebarCollapsedNavigation } = useGeneralSettings();

    const sidebarItemsWithRoute: (SidebarItemType & {
        activeIcon: IconType;
        icon: IconType;
    })[] = useMemo(() => {
        if (!sidebarItems) return [];

        const items = sidebarItems
            .filter((item) => !item.disabled)
            .map((item) => ({
                ...item,
                ...sidebarItemMap[item.route as keyof typeof sidebarItemMap],
            }));

        return items;
    }, [sidebarItems]);

    return (
        <SidebarContainer $windowBarStyle={windowBarStyle}>
            <ScrollArea
                scrollHideDelay={0}
                scrollbarSize={8}
            >
                {sidebarCollapsedNavigation && (
                    <Group
                        grow
                        spacing={0}
                        style={{
                            borderRight: 'var(--sidebar-border)',
                        }}
                    >
                        <CollapsedSidebarButton
                            component={UnstyledButton}
                            onClick={() => navigate(-1)}
                        >
                            <RiArrowLeftSLine size="22" />
                        </CollapsedSidebarButton>
                        <CollapsedSidebarButton
                            component={UnstyledButton}
                            onClick={() => navigate(1)}
                        >
                            <RiArrowRightSLine size="22" />
                        </CollapsedSidebarButton>
                    </Group>
                )}
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
                {sidebarItemsWithRoute.map((item) => (
                    <CollapsedSidebarItem
                        key={item.id}
                        activeIcon={<item.activeIcon size="25" />}
                        component={NavLink}
                        icon={<item.icon size="25" />}
                        label={item.label}
                        route={item.route}
                        to={item.route}
                    />
                ))}
            </ScrollArea>
        </SidebarContainer>
    );
};
