import { useMemo } from 'react';
import { Group, UnstyledButton } from '@mantine/core';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RiArrowLeftSLine, RiArrowRightSLine, RiMenuFill } from 'react-icons/ri';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DropdownMenu, ScrollArea } from '/@/renderer/components';
import { CollapsedSidebarButton } from '/@/renderer/features/sidebar/components/collapsed-sidebar-button';
import { CollapsedSidebarItem } from '/@/renderer/features/sidebar/components/collapsed-sidebar-item';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { SidebarItemType, useCurrentServer, useGeneralSettings, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/renderer/types';
import { enableSideBarItem } from '/@/renderer/api/utils';

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

export const CollapsedSidebar = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const navigate = useNavigate();
    const { windowBarStyle } = useWindowSettings();
    const { sidebarItems, sidebarCollapsedNavigation } = useGeneralSettings();

    const translatedSidebarItemMap = useMemo(
        () => ({
            About: t('page.sidebar.about', { postProcess: 'titleCase' }),
            Albums: t('page.sidebar.albums', { postProcess: 'titleCase' }),
            Artists: t('page.sidebar.artists', { postProcess: 'titleCase' }),
            Folders: t('page.sidebar.folders', { postProcess: 'titleCase' }),
            Genres: t('page.sidebar.genres', { postProcess: 'titleCase' }),
            Home: t('page.sidebar.home', { postProcess: 'titleCase' }),
            Mixes: t('page.sidebar.mixes', { postProcess: 'titleCase' }),
            'Now Playing': t('page.sidebar.nowPlaying', { postProcess: 'titleCase' }),
            Playlists: t('page.sidebar.playlists', { postProcess: 'titleCase' }),
            Search: t('page.sidebar.search', { postProcess: 'titleCase' }),
            Settings: t('page.sidebar.settings', { postProcess: 'titleCase' }),
            Tracks: t('page.sidebar.tracks', { postProcess: 'titleCase' }),
        }),
        [t],
    );

    const sidebarItemsWithRoute: SidebarItemType[] = useMemo(() => {
        if (!sidebarItems) return [];

        const items = sidebarItems
            .filter((item) => enableSideBarItem(server, item.disabled, item.requiresUserAccount))
            .map((item) => ({
                ...item,
                label:
                    translatedSidebarItemMap[item.id as keyof typeof translatedSidebarItemMap] ??
                    item.label,
            }));

        return items;
    }, [sidebarItems, translatedSidebarItemMap]);

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
                            label={t('common.menu', { postProcess: 'titleCase' })}
                        />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <AppMenu />
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                {sidebarItemsWithRoute.map((item) => (
                    <CollapsedSidebarItem
                        key={item.id}
                        activeIcon={
                            <SidebarIcon
                                active
                                route={item.route}
                                size="25"
                            />
                        }
                        component={NavLink}
                        icon={
                            <SidebarIcon
                                route={item.route}
                                size="25"
                            />
                        }
                        label={item.label}
                        route={item.route}
                        to={item.route}
                    />
                ))}
            </ScrollArea>
        </SidebarContainer>
    );
};
