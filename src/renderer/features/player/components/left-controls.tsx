import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';
import { shallow } from 'zustand/shallow';

import styles from './left-controls.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { RadioMetadataDisplay } from '/@/renderer/features/player/components/radio-metadata-display';
import { useIsRadioActive } from '/@/renderer/features/radio/hooks/use-radio-player';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAppStore,
    useAppStoreActions,
    useFullScreenPlayerStore,
    useHotkeySettings,
    usePlayerSong,
    useSetFullScreenPlayerStore,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { LibraryItem } from '/@/shared/types/domain-types';

export const LeftControls = () => {
    const { t } = useTranslation();
    const { setSideBar } = useAppStoreActions();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();

    const { collapsed, image } = useAppStore(
        (state) => ({
            collapsed: state.sidebar.collapsed,
            image: state.sidebar.image,
        }),
        shallow,
    );

    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const { bindings } = useHotkeySettings();

    const isRadioMode = isRadioActive;
    const hideImage = image && !collapsed;
    const isSongDefined = Boolean(currentSong?.id) && !isRadioMode;
    const title = currentSong?.name;
    const artists = currentSong?.artists;

    const handleToggleFullScreenPlayer = (e?: KeyboardEvent | MouseEvent<HTMLDivElement>) => {
        // don't toggle if right click
        if (e && 'button' in e && e.button === 2) {
            return;
        }

        e?.stopPropagation();
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const handleToggleSidebarImage = (e?: MouseEvent<HTMLButtonElement>) => {
        e?.stopPropagation();
        setSideBar({ image: true });
    };

    const handleToggleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentSong) {
            return;
        }

        ContextMenuController.call({
            cmd: { items: [currentSong], type: LibraryItem.SONG },
            event: e,
        });
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
                <AnimatePresence initial={false} mode="popLayout">
                    {!hideImage && (
                        <div className={styles.imageWrapper}>
                            <motion.div
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className={styles.image}
                                exit={{ opacity: 0, x: -50 }}
                                initial={{ opacity: 0, x: -50 }}
                                key="playerbar-image"
                                onClick={handleToggleFullScreenPlayer}
                                onContextMenu={handleToggleContextMenu}
                                role="button"
                                transition={{ duration: 0.2, ease: 'easeIn' }}
                            >
                                <Tooltip
                                    label={t('player.toggleFullscreenPlayer', {
                                        postProcess: 'sentenceCase',
                                    })}
                                    openDelay={0}
                                >
                                    {isRadioMode ? (
                                        <Center
                                            className={clsx(
                                                styles.playerbarImage,
                                                styles.radioImage,
                                            )}
                                        >
                                            <Icon color="muted" icon="radio" size="40%" />
                                        </Center>
                                    ) : (
                                        <ItemImage
                                            className={clsx(
                                                styles.playerbarImage,
                                                PlaybackSelectors.playerCoverArt,
                                            )}
                                            enableDebounce={false}
                                            enableViewport={false}
                                            explicitStatus={currentSong?.explicitStatus}
                                            fetchPriority="high"
                                            id={currentSong?.imageId}
                                            itemType={LibraryItem.SONG}
                                            serverId={currentSong?._serverId}
                                            type="table"
                                        />
                                    )}
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
                                            openDelay: 0,
                                        }}
                                    />
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                <motion.div className={styles.metadataStack} layout="position">
                    {isRadioMode ? (
                        <RadioMetadataDisplay
                            onStopPropagation={stopPropagation}
                            onToggleContextMenu={handleToggleContextMenu}
                        />
                    ) : (
                        <>
                            <div className={styles.lineItem} onClick={stopPropagation}>
                                <Group align="center" gap="xs" wrap="nowrap">
                                    <Text
                                        className={PlaybackSelectors.songTitle}
                                        component={Link}
                                        fw={500}
                                        isLink
                                        onContextMenu={handleToggleContextMenu}
                                        overflow="hidden"
                                        to={AppRoute.NOW_PLAYING}
                                    >
                                        {title || '—'}
                                        {currentSong?.trackSubtitle && (
                                            <Text component="span" isMuted size="sm">
                                                {' ('}
                                                {currentSong.trackSubtitle}
                                                {')'}
                                            </Text>
                                        )}
                                    </Text>
                                    {isSongDefined && (
                                        <ActionIcon
                                            icon="ellipsisVertical"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (currentSong) {
                                                    ContextMenuController.call({
                                                        cmd: {
                                                            items: [currentSong],
                                                            type: LibraryItem.SONG,
                                                        },
                                                        event: e,
                                                    });
                                                }
                                            }}
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
                                className={clsx(
                                    styles.lineItem,
                                    styles.secondary,
                                    PlaybackSelectors.songArtist,
                                )}
                                onClick={stopPropagation}
                            >
                                <JoinedArtists
                                    artistName={currentSong?.artistName || ''}
                                    artists={artists || []}
                                />
                            </div>
                            <div
                                className={clsx(
                                    styles.lineItem,
                                    styles.secondary,
                                    PlaybackSelectors.songAlbum,
                                )}
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
                        </>
                    )}
                </motion.div>
            </LayoutGroup>
        </div>
    );
};
