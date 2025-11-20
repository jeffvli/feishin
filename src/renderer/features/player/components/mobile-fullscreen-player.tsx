import { motion } from 'motion/react';
import { CSSProperties, MouseEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './mobile-fullscreen-player.module.css';

import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { MobileFullscreenPlayerAlbumArt } from '/@/renderer/features/player/components/mobile-fullscreen-player-album-art';
import { MobileFullscreenPlayerBottomControls } from '/@/renderer/features/player/components/mobile-fullscreen-player-bottom-controls';
import { MobileFullscreenPlayerControls } from '/@/renderer/features/player/components/mobile-fullscreen-player-controls';
import { MobileFullscreenPlayerHeader } from '/@/renderer/features/player/components/mobile-fullscreen-player-header';
import { MobileFullscreenPlayerMetadata } from '/@/renderer/features/player/components/mobile-fullscreen-player-metadata';
import { MobileFullscreenPlayerProgress } from '/@/renderer/features/player/components/mobile-fullscreen-player-progress';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { useFastAverageColor } from '/@/renderer/hooks';
import {
    useCurrentServer,
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    usePlayerData,
    usePlayerSong,
    useSetFullScreenPlayerStore,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

const mainBackground = 'var(--theme-colors-background)';

export const MobileFullscreenPlayer = () => {
    const { t } = useTranslation();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { activeTab, dynamicBackground, dynamicImageBlur, dynamicIsImage } =
        useFullScreenPlayerStore();
    const currentSong = usePlayerSong();
    const { currentSong: currentSongData } = usePlayerData();
    const server = useCurrentServer();
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});
    const updateRatingMutation = useSetRating({});

    const [isPageHovered, setIsPageHovered] = useState(false);

    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: currentSong?.imageUrl,
        srcLoaded: true,
    });

    const imageUrl = currentSong?.imageUrl && currentSong.imageUrl.replace(/size=\d+/g, 'size=500');
    const backgroundImage =
        imageUrl && dynamicIsImage
            ? `url("${imageUrl.replace(currentSong.id, currentSong.albumId)}"), url("${imageUrl}")`
            : mainBackground;

    const handleToggleFullScreenPlayer = useCallback(() => {
        setFullScreenPlayerStore({ expanded: false });
    }, [setFullScreenPlayerStore]);

    const handleToggleContextMenu = useCallback(
        (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            if (!currentSong) {
                return;
            }

            ContextMenuController.call({
                cmd: { items: [currentSong], type: LibraryItem.SONG },
                event: e as unknown as MouseEvent<HTMLDivElement>,
            });
        },
        [currentSong],
    );

    const handleToggleQueue = useCallback(() => {
        setStore({ activeTab: activeTab === 'queue' ? 'player' : 'queue' });
    }, [activeTab, setStore]);

    const handleToggleFavorite = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            const song = currentSongData;
            if (!song?.id) return;

            if (song.userFavorite) {
                removeFromFavoritesMutation.mutate({
                    apiClientProps: { serverId: song?._serverId || '' },
                    query: {
                        id: [song.id],
                        type: LibraryItem.SONG,
                    },
                });
            } else {
                addToFavoritesMutation.mutate({
                    apiClientProps: { serverId: song?._serverId || '' },
                    query: {
                        id: [song.id],
                        type: LibraryItem.SONG,
                    },
                });
            }
        },
        [currentSongData, addToFavoritesMutation, removeFromFavoritesMutation],
    );

    const handleToggleLyrics = useCallback(() => {
        setStore({ activeTab: activeTab === 'lyrics' ? 'player' : 'lyrics' });
    }, [activeTab, setStore]);

    const handleUpdateRating = useCallback(
        (rating: number) => {
            if (!currentSong?.id) return;

            updateRatingMutation.mutate({
                apiClientProps: { serverId: currentSong?._serverId || '' },
                query: {
                    id: [currentSong.id],
                    rating,
                    type: LibraryItem.SONG,
                },
            });
        },
        [currentSong, updateRatingMutation],
    );

    const isPlayerState = activeTab !== 'queue' && activeTab !== 'lyrics';
    const isQueueState = activeTab === 'queue';
    const isLyricsState = activeTab === 'lyrics';
    const isSongDefined = Boolean(currentSong?.id);
    const showRating =
        isSongDefined &&
        (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC);

    return (
        <div
            className={styles.container}
            style={{
                background: dynamicBackground ? backgroundImage : mainBackground,
                backgroundColor: dynamicBackground ? background : mainBackground,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
            }}
        >
            {dynamicBackground && (
                <div
                    className={styles.backgroundImageOverlay}
                    style={
                        {
                            '--image-blur': `${dynamicImageBlur}rem`,
                        } as CSSProperties
                    }
                />
            )}
            <motion.div
                animate={{
                    opacity: isPlayerState ? 1 : 0,
                    zIndex: isPlayerState ? 2 : 1,
                }}
                className={styles.playerState}
                onMouseEnter={() => setIsPageHovered(true)}
                onMouseLeave={() => setIsPageHovered(false)}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <MobileFullscreenPlayerHeader
                    currentSong={currentSong}
                    isPageHovered={isPageHovered}
                    onClose={handleToggleFullScreenPlayer}
                />
                <MobileFullscreenPlayerAlbumArt currentSong={currentSong} />
                <MobileFullscreenPlayerMetadata
                    currentSong={currentSong}
                    onToggleFavorite={handleToggleFavorite}
                    onUpdateRating={handleUpdateRating}
                    showRating={showRating}
                />
                <MobileFullscreenPlayerProgress currentSong={currentSong} />
                <MobileFullscreenPlayerControls currentSong={currentSong} />
                <MobileFullscreenPlayerBottomControls
                    isLyricsActive={isLyricsState}
                    isQueueActive={isQueueState}
                    onToggleContextMenu={handleToggleContextMenu}
                    onToggleLyrics={handleToggleLyrics}
                    onToggleQueue={handleToggleQueue}
                />
            </motion.div>

            <motion.div
                animate={{
                    opacity: isQueueState ? 1 : 0,
                    zIndex: isQueueState ? 2 : 1,
                }}
                className={styles.queueState}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <div className={styles.queueHeader}>
                    <ActionIcon
                        icon="arrowDownS"
                        onClick={handleToggleFullScreenPlayer}
                        size="sm"
                        variant={isPageHovered ? 'default' : 'subtle'}
                    />
                    <ActionIcon
                        icon="x"
                        iconProps={{ size: 'xl' }}
                        onClick={handleToggleQueue}
                        size="sm"
                        variant={isPageHovered ? 'default' : 'subtle'}
                    />
                </div>
                <div className={styles.queueContent}>
                    <PlayQueue listKey={ItemListKey.FULL_SCREEN} searchTerm={undefined} />
                </div>
            </motion.div>

            <motion.div
                animate={{
                    opacity: isLyricsState ? 1 : 0,
                    zIndex: isLyricsState ? 2 : 1,
                }}
                className={styles.lyricsState}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <div className={styles.lyricsHeader}>
                    <ActionIcon
                        icon="arrowDownS"
                        onClick={handleToggleFullScreenPlayer}
                        size="sm"
                        variant={isPageHovered ? 'default' : 'subtle'}
                    />
                    <Text fw={600} size="lg">
                        {t('page.fullscreenPlayer.lyrics', { postProcess: 'sentenceCase' })}
                    </Text>
                    <ActionIcon
                        icon="x"
                        iconProps={{ size: 'xl' }}
                        onClick={handleToggleLyrics}
                        size="sm"
                        variant={isPageHovered ? 'default' : 'subtle'}
                    />
                </div>
                <div className={styles.lyricsContent}>
                    <Lyrics />
                </div>
            </motion.div>
        </div>
    );
};
