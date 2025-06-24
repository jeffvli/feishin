import { AnimatePresence, motion } from 'motion/react';
import { CSSProperties, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import styles from './sidebar.module.css';

import { ActionBar } from '/@/renderer/features/sidebar/components/action-bar';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import {
    SidebarPlaylistList,
    SidebarSharedPlaylistList,
} from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import {
    useAppStoreActions,
    useCurrentSong,
    useFullScreenPlayerStore,
    useSetFullScreenPlayerStore,
    useSidebarStore,
} from '/@/renderer/store';
import { SidebarItemType, useGeneralSettings } from '/@/renderer/store/settings.store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Image } from '/@/shared/components/image/image';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

export const Sidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const sidebar = useSidebarStore();
    const { setSideBar } = useAppStoreActions();
    const { sidebarPlaylistList } = useGeneralSettings();
    const imageUrl = useCurrentSong()?.imageUrl;

    const translatedSidebarItemMap = useMemo(
        () => ({
            Albums: t('page.sidebar.albums', { postProcess: 'titleCase' }),
            Artists: t('page.sidebar.albumArtists', { postProcess: 'titleCase' }),
            'Artists-all': t('page.sidebar.artists', { postProcess: 'titleCase' }),
            Genres: t('page.sidebar.genres', { postProcess: 'titleCase' }),
            Home: t('page.sidebar.home', { postProcess: 'titleCase' }),
            'Now Playing': t('page.sidebar.nowPlaying', { postProcess: 'titleCase' }),
            Playlists: t('page.sidebar.playlists', { postProcess: 'titleCase' }),
            Search: t('page.sidebar.search', { postProcess: 'titleCase' }),
            Settings: t('page.sidebar.settings', { postProcess: 'titleCase' }),
            Tracks: t('page.sidebar.tracks', { postProcess: 'titleCase' }),
        }),
        [t],
    );
    const upsizedImageUrl = imageUrl
        ?.replace(/size=\d+/, 'size=450')
        .replace(/width=\d+/, 'width=450')
        .replace(/height=\d+/, 'height=450');

    const showImage = sidebar.image;

    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const expandFullScreenPlayer = () => {
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const { sidebarItems } = useGeneralSettings();

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
        <div
            className={styles.container}
            id="left-sidebar"
        >
            <Group id="global-search-container">
                <ActionBar />
            </Group>
            <ScrollArea
                allowDragScroll
                className={styles.scrollArea}
                style={{
                    maxHeight: showImage ? `calc(100vh - 90px - ${sidebar.leftWidth})` : '100%',
                }}
            >
                <Accordion
                    classNames={{
                        content: styles.accordionContent,
                        control: styles.accordionControl,
                        item: styles.accordionItem,
                        root: styles.accordionRoot,
                    }}
                    multiple
                >
                    <Accordion.Item value="library">
                        <Accordion.Control>
                            <Text
                                fw={600}
                                variant="secondary"
                            >
                                {t('page.sidebar.myLibrary', {
                                    postProcess: 'titleCase',
                                })}
                            </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            {sidebarItemsWithRoute.map((item) => {
                                return (
                                    <SidebarItem
                                        key={`sidebar-${item.route}`}
                                        to={item.route}
                                    >
                                        <Group gap="sm">
                                            <SidebarIcon
                                                active={location.pathname === item.route}
                                                route={item.route}
                                            />
                                            {item.label}
                                        </Group>
                                    </SidebarItem>
                                );
                            })}
                        </Accordion.Panel>
                    </Accordion.Item>
                    {sidebarPlaylistList && (
                        <>
                            <SidebarPlaylistList />
                            <SidebarSharedPlaylistList />
                        </>
                    )}
                </Accordion>
            </ScrollArea>
            <AnimatePresence
                initial={false}
                mode="popLayout"
            >
                {showImage && (
                    <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.imageContainer}
                        exit={{ opacity: 0, y: 200 }}
                        initial={{ opacity: 0, y: 200 }}
                        key="sidebar-image"
                        onClick={expandFullScreenPlayer}
                        role="button"
                        style={
                            {
                                '--sidebar-image-height': sidebar.leftWidth,
                            } as CSSProperties
                        }
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <Tooltip
                            label={t('player.toggleFullscreenPlayer', {
                                postProcess: 'sentenceCase',
                            })}
                            openDelay={500}
                        >
                            <Image
                                className={styles.sidebarImage}
                                includeLoader={false}
                                includeUnloader={false}
                                loading="eager"
                                src={upsizedImageUrl || ''}
                            />
                        </Tooltip>
                        <ActionIcon
                            icon="arrowDownS"
                            iconProps={{
                                size: 'lg',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSideBar({ image: false });
                            }}
                            opacity={0.8}
                            radius="md"
                            style={{
                                cursor: 'default',
                                position: 'absolute',
                                right: 5,
                                top: 5,
                            }}
                            tooltip={{
                                label: t('common.collapse', {
                                    postProcess: 'titleCase',
                                }),
                                openDelay: 500,
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
