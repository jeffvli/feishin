import clsx from 'clsx';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useNavigate } from 'react-router';

import styles from './collapsed-sidebar.module.css';

import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { CollapsedSidebarButton } from '/@/renderer/features/sidebar/components/collapsed-sidebar-button';
import { CollapsedSidebarItem } from '/@/renderer/features/sidebar/components/collapsed-sidebar-item';
import { ServerSelectorItems } from '/@/renderer/features/sidebar/components/server-selector-items';
import { getCollectionTo } from '/@/renderer/features/sidebar/components/sidebar-collection-list';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { AppRoute } from '/@/renderer/router/routes';
import {
    SidebarItemType,
    useCollections,
    useCurrentServer,
    useSidebarCollapsedNavigation,
    useSidebarItems,
    useWindowSettings,
} from '/@/renderer/store';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

export const CollapsedSidebar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const collections = useCollections();
    const { windowBarStyle } = useWindowSettings();
    const sidebarCollapsedNavigation = useSidebarCollapsedNavigation();
    const sidebarItems = useSidebarItems();
    const currentServer = useCurrentServer();

    const translatedSidebarItemMap = useMemo(
        () => ({
            Albums: t('page.sidebar.albums', { postProcess: 'titleCase' }),
            Artists: t('page.sidebar.albumArtists', { postProcess: 'titleCase' }).replace(
                ' ',
                '\n',
            ),
            'Artists-all': t('page.sidebar.artists', { postProcess: 'titleCase' }),
            Collections: t('page.sidebar.collections', { postProcess: 'titleCase' }),
            Favorites: t('page.sidebar.favorites', { postProcess: 'titleCase' }),
            Folders: t('page.sidebar.folders', { postProcess: 'titleCase' }),
            Genres: t('page.sidebar.genres', { postProcess: 'titleCase' }),
            Home: t('page.sidebar.home', { postProcess: 'titleCase' }),
            'Now Playing': t('page.sidebar.nowPlaying', { postProcess: 'titleCase' }),
            Playlists: t('page.sidebar.playlists', { postProcess: 'titleCase' }),
            Radio: t('page.sidebar.radio', { postProcess: 'titleCase' }),
            Search: t('page.sidebar.search', { postProcess: 'titleCase' }),
            Settings: t('page.sidebar.settings', { postProcess: 'titleCase' }),
            Tracks: t('page.sidebar.tracks', { postProcess: 'titleCase' }),
        }),
        [t],
    );

    const sidebarItemsWithRoute: SidebarItemType[] = useMemo(() => {
        if (!sidebarItems) return [];

        const items = sidebarItems
            .filter((item) => !item.disabled)
            .map((item) => ({
                ...item,
                label:
                    translatedSidebarItemMap[item.id as keyof typeof translatedSidebarItemMap] ??
                    item.label,
            }));

        return items;
    }, [sidebarItems, translatedSidebarItemMap]);

    return (
        <motion.div
            className={clsx({
                [styles.linux]: windowBarStyle === Platform.LINUX,
                [styles.sidebarContainer]: true,
                [styles.web]: windowBarStyle === Platform.WEB,
            })}
        >
            <ScrollArea>
                {sidebarCollapsedNavigation && (
                    <Group gap={0} grow>
                        <CollapsedSidebarButton onClick={() => navigate(-1)}>
                            <Icon icon="arrowLeftS" size="xl" />
                        </CollapsedSidebarButton>
                        <CollapsedSidebarButton onClick={() => navigate(1)}>
                            <Icon icon="arrowRightS" size="xl" />
                        </CollapsedSidebarButton>
                    </Group>
                )}
                <DropdownMenu position="right-start">
                    <DropdownMenu.Target>
                        <CollapsedSidebarItem
                            activeIcon={null}
                            component={Flex}
                            icon={<Icon fill="muted" icon="menu" size="3xl" />}
                            label={t('common.menu', { postProcess: 'titleCase' })}
                            style={{
                                cursor: 'pointer',
                                padding: 'var(--theme-spacing-md) 0',
                            }}
                        />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <AppMenu />
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                {sidebarItemsWithRoute.map((item) =>
                    item.id === 'Collections' ? (
                        collections && collections.length > 0 ? (
                            <DropdownMenu key={item.id} offset={0} position="right-end">
                                <DropdownMenu.Target>
                                    <CollapsedSidebarItem
                                        activeIcon={null}
                                        component={Flex}
                                        icon={<Icon color="muted" icon="collection" size="3xl" />}
                                        label={item.label}
                                        style={{
                                            cursor: 'pointer',
                                            padding: 'var(--theme-spacing-md) 0',
                                        }}
                                    />
                                </DropdownMenu.Target>
                                <DropdownMenu.Dropdown>
                                    <ScrollArea style={{ maxHeight: '50vh' }}>
                                        <Stack gap={0} p="xs">
                                            {collections.map((collection) => {
                                                const to = getCollectionTo(collection);
                                                return (
                                                    <DropdownMenu.Item
                                                        component={Link}
                                                        key={collection.id}
                                                        leftSection={
                                                            <SidebarIcon
                                                                route={
                                                                    collection.type ===
                                                                    LibraryItem.ALBUM
                                                                        ? AppRoute.LIBRARY_ALBUMS
                                                                        : AppRoute.LIBRARY_SONGS
                                                                }
                                                            />
                                                        }
                                                        to={to}
                                                    >
                                                        {collection.name}
                                                    </DropdownMenu.Item>
                                                );
                                            })}
                                        </Stack>
                                    </ScrollArea>
                                </DropdownMenu.Dropdown>
                            </DropdownMenu>
                        ) : null
                    ) : (
                        <CollapsedSidebarItem
                            activeIcon={<SidebarIcon active route={item.route} size="25" />}
                            component={NavLink}
                            icon={<SidebarIcon route={item.route} size="25" />}
                            key={item.id}
                            label={item.label}
                            route={item.route}
                            to={item.route}
                        />
                    ),
                )}
                {currentServer && (
                    <DropdownMenu offset={0} position="right-end" width={240}>
                        <DropdownMenu.Target>
                            <CollapsedSidebarItem
                                activeIcon={null}
                                component={Flex}
                                icon={
                                    <img
                                        className={styles.serverIcon}
                                        src={
                                            currentServer.type === ServerType.NAVIDROME
                                                ? NavidromeLogo
                                                : currentServer.type === ServerType.JELLYFIN
                                                  ? JellyfinLogo
                                                  : OpenSubsonicLogo
                                        }
                                    />
                                }
                                label={''}
                                py="md"
                                style={{
                                    cursor: 'pointer',
                                }}
                            />
                        </DropdownMenu.Target>
                        <DropdownMenu.Dropdown>
                            <ScrollArea style={{ maxHeight: '95vh' }}>
                                <ServerSelectorItems />
                            </ScrollArea>
                        </DropdownMenu.Dropdown>
                    </DropdownMenu>
                )}
            </ScrollArea>
        </motion.div>
    );
};
