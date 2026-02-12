import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { CSSProperties, MouseEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './sidebar.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { ActionBar } from '/@/renderer/features/sidebar/components/action-bar';
import { ServerSelector } from '/@/renderer/features/sidebar/components/server-selector';
import { SidebarCollectionList } from '/@/renderer/features/sidebar/components/sidebar-collection-list';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import {
    SidebarPlaylistList,
    SidebarSharedPlaylistList,
} from '/@/renderer/features/sidebar/components/sidebar-playlist-list';
import {
    useAppStore,
    useAppStoreActions,
    useFullScreenPlayerStore,
    useGeneralSettings,
    usePlayerSong,
    useSetFullScreenPlayerStore,
} from '/@/renderer/store';
import {
    SidebarItemType,
    useSidebarItems,
    useSidebarPlaylistList,
    useWindowSettings,
} from '/@/renderer/store/settings.store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ImageUnloader } from '/@/shared/components/image/image';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { ExplicitStatus, LibraryItem } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

export const Sidebar = () => {
    const { t } = useTranslation();

    const sidebarPlaylistList = useSidebarPlaylistList();

    const translatedSidebarItemMap = useMemo(
        () => ({
            Albums: t('page.sidebar.albums', { postProcess: 'titleCase' }),
            Artists: t('page.sidebar.albumArtists', { postProcess: 'titleCase' }),
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

    const sidebarItems = useSidebarItems();
    const { windowBarStyle } = useWindowSettings();
    const sidebarImageEnabled = useAppStore((state) => state.sidebar.image);
    const showImage = sidebarImageEnabled;

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

    /* Library accordion: only items with a route (exclude Collections section) */
    const libraryItemsWithRoute = useMemo(
        () => sidebarItemsWithRoute.filter((item) => item.id !== 'Collections' && item.route),
        [sidebarItemsWithRoute],
    );

    const isCustomWindowBar =
        windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS;

    return (
        <div
            className={clsx(styles.container, {
                [styles.customBar]: isCustomWindowBar,
            })}
            id="left-sidebar"
        >
            <Group grow id="global-search-container" style={{ flexShrink: 0 }}>
                <ActionBar />
            </Group>
            <ScrollArea allowDragScroll className={styles.scrollArea}>
                <Accordion
                    classNames={{
                        content: styles.accordionContent,
                        control: styles.accordionControl,
                        item: styles.accordionItem,
                        root: styles.accordionRoot,
                    }}
                    defaultValue={['library', 'collections', 'playlists']}
                    multiple
                >
                    <Accordion.Item value="library">
                        <Accordion.Control>
                            <Text fw={500} variant="secondary">
                                {t('page.sidebar.myLibrary', {
                                    postProcess: 'titleCase',
                                })}
                            </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            {libraryItemsWithRoute.map((item) => {
                                return (
                                    <SidebarItem key={`sidebar-${item.route}`} to={item.route}>
                                        <Group gap="md">
                                            <SidebarIcon route={item.route} />
                                            {item.label}
                                        </Group>
                                    </SidebarItem>
                                );
                            })}
                        </Accordion.Panel>
                    </Accordion.Item>
                    <SidebarCollectionList />
                    {sidebarPlaylistList && (
                        <>
                            <SidebarPlaylistList />
                            <SidebarSharedPlaylistList />
                        </>
                    )}
                </Accordion>
            </ScrollArea>
            <AnimatePresence initial={false} mode="popLayout">
                <motion.div className={styles.serverSelectorWrapper} key="server-selector" layout>
                    <ServerSelector />
                </motion.div>
                {showImage && <SidebarImage />}
            </AnimatePresence>
        </div>
    );
};

const SidebarImage = () => {
    const { t } = useTranslation();
    const leftWidth = useAppStore((state) => state.sidebar.leftWidth);
    const { setSideBar } = useAppStoreActions();
    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying } = useRadioPlayer();
    const { blurExplicitImages } = useGeneralSettings();

    const imageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        itemType: LibraryItem.SONG,
        serverId: currentSong?._serverId,
        type: 'sidebar',
    });

    const isPlayingRadio = isRadioActive && isRadioPlaying;
    const isSongDefined = Boolean(currentSong?.id);

    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const expandFullScreenPlayer = () => {
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const handleToggleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentSong || isPlayingRadio) {
            return;
        }

        if (isSongDefined && !isFullScreenPlayerExpanded) {
            ContextMenuController.call({
                cmd: { items: [currentSong!], type: LibraryItem.SONG },
                event: e,
            });
        }
    };

    return (
        <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles.imageContainer}
            exit={{ opacity: 0, y: 200 }}
            initial={{ opacity: 0, y: 200 }}
            key="sidebar-image"
            onClick={expandFullScreenPlayer}
            onContextMenu={handleToggleContextMenu}
            role="button"
            style={
                {
                    '--sidebar-image-height': leftWidth,
                } as CSSProperties
            }
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <Tooltip
                label={t('player.toggleFullscreenPlayer', {
                    postProcess: 'sentenceCase',
                })}
            >
                {isPlayingRadio ? (
                    <Center
                        className={styles.sidebarImage}
                        style={{
                            background: 'var(--theme-colors-surface)',
                            borderRadius: 'var(--theme-card-default-radius)',
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        <Icon color="muted" icon="radio" size="40%" />
                    </Center>
                ) : imageUrl ? (
                    <img
                        className={clsx(styles.sidebarImage, {
                            [styles.censored]:
                                currentSong?.explicitStatus === ExplicitStatus.EXPLICIT &&
                                blurExplicitImages,
                        })}
                        loading="eager"
                        src={imageUrl}
                    />
                ) : (
                    <ImageUnloader icon="emptySongImage" />
                )}
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
                    right: '1rem',
                    top: '1rem',
                }}
                tooltip={{
                    label: t('common.collapse', {
                        postProcess: 'titleCase',
                    }),
                    openDelay: 500,
                }}
            />
        </motion.div>
    );
};
