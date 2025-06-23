import { useHotkeys } from '@mantine/hooks';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import React, { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router-dom';

import styles from './left-controls.module.css';

import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAppStoreActions,
    useCurrentSong,
    useFullScreenPlayerStore,
    useHotkeySettings,
    useSetFullScreenPlayerStore,
    useSidebarStore,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Image } from '/@/shared/components/image/image';
import { Separator } from '/@/shared/components/separator/separator';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { LibraryItem } from '/@/shared/types/domain-types';

export const LeftControls = () => {
    const { t } = useTranslation();
    const { setSideBar } = useAppStoreActions();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { collapsed, image } = useSidebarStore();
    const hideImage = image && !collapsed;
    const currentSong = useCurrentSong();
    const title = currentSong?.name;
    const artists = currentSong?.artists;
    const { bindings } = useHotkeySettings();

    const isSongDefined = Boolean(currentSong?.id);

    const handleGeneralContextMenu = useHandleGeneralContextMenu(
        LibraryItem.SONG,
        SONG_CONTEXT_MENU_ITEMS,
    );

    const handleToggleFullScreenPlayer = (e?: KeyboardEvent | MouseEvent<HTMLDivElement>) => {
        e?.stopPropagation();
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const handleToggleSidebarImage = (e?: MouseEvent<HTMLButtonElement>) => {
        e?.stopPropagation();
        setSideBar({ image: true });
    };

    const stopPropagation = (e?: MouseEvent) => e?.stopPropagation();

    useHotkeys([
        [
            bindings.toggleFullscreenPlayer.allowGlobal
                ? ''
                : bindings.toggleFullscreenPlayer.hotkey,
            handleToggleFullScreenPlayer,
        ],
    ]);

    return (
        <div className={styles.leftControlsContainer}>
            <LayoutGroup>
                <AnimatePresence
                    initial={false}
                    mode="wait"
                >
                    {!hideImage && (
                        <div className={styles.imageWrapper}>
                            <motion.div
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className={styles.image}
                                exit={{ opacity: 0, x: -50 }}
                                initial={{ opacity: 0, x: -50 }}
                                key="playerbar-image"
                                onClick={handleToggleFullScreenPlayer}
                                role="button"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <Tooltip
                                    label={t('player.toggleFullscreenPlayer', {
                                        postProcess: 'sentenceCase',
                                    })}
                                    openDelay={500}
                                >
                                    <Image
                                        className={styles.playerbarImage}
                                        loading="eager"
                                        src={currentSong?.imageUrl ?? ''}
                                    />
                                </Tooltip>
                                {!collapsed && (
                                    <ActionIcon
                                        icon="arrowUpS"
                                        iconProps={{ size: 'xl' }}
                                        onClick={handleToggleSidebarImage}
                                        opacity={0.8}
                                        radius="md"
                                        size="xs"
                                        style={{
                                            cursor: 'default',
                                            position: 'absolute',
                                            right: 2,
                                            top: 2,
                                        }}
                                        tooltip={{
                                            label: t('common.expand', {
                                                postProcess: 'titleCase',
                                            }),
                                            openDelay: 500,
                                        }}
                                    />
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                <motion.div
                    className={styles.metadataStack}
                    layout="position"
                >
                    <div
                        className={styles.lineItem}
                        onClick={stopPropagation}
                    >
                        <Group
                            align="center"
                            gap="xs"
                            wrap="nowrap"
                        >
                            <Text
                                component={Link}
                                fw={500}
                                isLink
                                overflow="hidden"
                                to={AppRoute.NOW_PLAYING}
                            >
                                {title || '—'}
                            </Text>
                            {isSongDefined && (
                                <ActionIcon
                                    icon="ellipsisVertical"
                                    onClick={(e) => handleGeneralContextMenu(e, [currentSong!])}
                                    size="xs"
                                    styles={{
                                        root: {
                                            '--ai-size-xs': '1.15rem',
                                        },
                                    }}
                                    variant="subtle"
                                />
                            )}
                        </Group>
                    </div>
                    <div
                        className={clsx(styles.lineItem, styles.secondary)}
                        onClick={stopPropagation}
                    >
                        {artists?.map((artist, index) => (
                            <React.Fragment key={`bar-${artist.id}`}>
                                {index > 0 && <Separator />}
                                <Text
                                    component={artist.id ? Link : undefined}
                                    fw={500}
                                    isLink={artist.id !== ''}
                                    overflow="hidden"
                                    size="md"
                                    to={
                                        artist.id
                                            ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                                  albumArtistId: artist.id,
                                              })
                                            : undefined
                                    }
                                >
                                    {artist.name || '—'}
                                </Text>
                            </React.Fragment>
                        ))}
                    </div>
                    <div
                        className={clsx(styles.lineItem, styles.secondary)}
                        onClick={stopPropagation}
                    >
                        <Text
                            component={Link}
                            fw={500}
                            isLink
                            overflow="hidden"
                            size="md"
                            to={
                                currentSong?.albumId
                                    ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                          albumId: currentSong.albumId,
                                      })
                                    : ''
                            }
                        >
                            {currentSong?.album || '—'}
                        </Text>
                    </div>
                </motion.div>
            </LayoutGroup>
        </div>
    );
};
