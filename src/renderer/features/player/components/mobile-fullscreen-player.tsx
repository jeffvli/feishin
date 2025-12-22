import { AnimatePresence, motion } from 'motion/react';
import { Variants } from 'motion/react';
import {
    CSSProperties,
    memo,
    MouseEvent,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
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

const backgroundImageVariants: Variants = {
    closed: {
        opacity: 0,
        transition: {
            duration: 0.8,
            ease: 'linear',
        },
    },
    initial: {
        opacity: 0,
    },
    open: (custom) => {
        const { isOpen } = custom;
        return {
            opacity: isOpen ? 1 : 0,
            transition: {
                duration: 0.4,
                ease: 'linear',
            },
        };
    },
};

interface BackgroundImageProps {
    dynamicBackground: boolean | undefined;
    dynamicIsImage: boolean | undefined;
}

const BackgroundImage = memo(({ dynamicBackground, dynamicIsImage }: BackgroundImageProps) => {
    const currentSong = usePlayerSong();
    const { nextSong } = usePlayerData();

    const [imageState, setImageState] = useState({
        bottomImage: nextSong?.imageUrl
            ? nextSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined,
        current: 0,
        topImage: currentSong?.imageUrl
            ? currentSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined,
    });

    const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
    const imageStateRef = useRef(imageState);

    useEffect(() => {
        imageStateRef.current = imageState;
    }, [imageState]);

    // Update images when song changes
    useEffect(() => {
        if (currentSong?._uniqueId === previousSongRef.current) {
            return;
        }

        const isTop = imageStateRef.current.current === 0;
        const currentImageUrl = currentSong?.imageUrl
            ? currentSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined;
        const nextImageUrl = nextSong?.imageUrl
            ? nextSong.imageUrl.replace(/size=\d+/g, 'size=500')
            : undefined;

        setImageState({
            bottomImage: isTop ? currentImageUrl : nextImageUrl,
            current: isTop ? 1 : 0,
            topImage: isTop ? nextImageUrl : currentImageUrl,
        });

        previousSongRef.current = currentSong?._uniqueId;
    }, [currentSong?._uniqueId, currentSong?.imageUrl, nextSong?._uniqueId, nextSong?.imageUrl]);

    if (!dynamicBackground || !dynamicIsImage) {
        return null;
    }

    const getBackgroundImageUrl = (
        imageUrl: string | undefined,
        songId: string | undefined,
        albumId: string | undefined,
    ) => {
        if (!imageUrl || !songId || !albumId) {
            return imageUrl;
        }
        return imageUrl.replace(songId, albumId);
    };

    // Determine which song IDs to use for keys and image URLs
    const topSongId = imageState.current === 0 ? currentSong?._uniqueId : nextSong?._uniqueId;
    const bottomSongId = imageState.current === 0 ? nextSong?._uniqueId : currentSong?._uniqueId;
    const topSong = imageState.current === 0 ? currentSong : nextSong;
    const bottomSong = imageState.current === 0 ? nextSong : currentSong;

    return (
        <AnimatePresence initial={false} mode="sync">
            {imageState.current === 0 && imageState.topImage && (
                <motion.div
                    animate="open"
                    className={styles.backgroundImage}
                    custom={{ isOpen: imageState.current === 0 }}
                    exit="closed"
                    initial="open"
                    key={`top-${topSongId || 'none'}`}
                    style={
                        {
                            backgroundImage: imageState.topImage
                                ? `url("${getBackgroundImageUrl(
                                      imageState.topImage,
                                      topSong?.id,
                                      topSong?.albumId,
                                  )}"), url("${imageState.topImage}")`
                                : undefined,
                        } as CSSProperties
                    }
                    variants={backgroundImageVariants}
                />
            )}

            {imageState.current === 1 && imageState.bottomImage && (
                <motion.div
                    animate="open"
                    className={styles.backgroundImage}
                    custom={{ isOpen: imageState.current === 1 }}
                    exit="closed"
                    initial="open"
                    key={`bottom-${bottomSongId || 'none'}`}
                    style={
                        {
                            backgroundImage: imageState.bottomImage
                                ? `url("${getBackgroundImageUrl(
                                      imageState.bottomImage,
                                      bottomSong?.id,
                                      bottomSong?.albumId,
                                  )}"), url("${imageState.bottomImage}")`
                                : undefined,
                        } as CSSProperties
                    }
                    variants={backgroundImageVariants}
                />
            )}
        </AnimatePresence>
    );
});

BackgroundImage.displayName = 'BackgroundImage';

const overlayVariants: Variants = {
    closed: {
        opacity: 0,
        transition: {
            duration: 0,
        },
    },
    initial: {
        opacity: 1,
    },
    open: {
        opacity: 1,
        transition: {
            duration: 0,
        },
    },
};

interface BackgroundImageOverlayProps {
    dynamicBackground: boolean | undefined;
    dynamicImageBlur: number | undefined;
}

const BackgroundImageOverlay = memo(
    ({ dynamicBackground, dynamicImageBlur }: BackgroundImageOverlayProps) => {
        const currentSong = usePlayerSong();
        const { nextSong } = usePlayerData();

        const [overlayState, setOverlayState] = useState({
            bottomSongId: nextSong?._uniqueId,
            current: 0,
            topSongId: currentSong?._uniqueId,
        });

        const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
        const overlayStateRef = useRef(overlayState);

        useEffect(() => {
            overlayStateRef.current = overlayState;
        }, [overlayState]);

        // Update overlays when song changes
        useEffect(() => {
            if (currentSong?._uniqueId === previousSongRef.current) {
                return;
            }

            const isTop = overlayStateRef.current.current === 0;

            setOverlayState({
                bottomSongId: isTop ? currentSong?._uniqueId : nextSong?._uniqueId,
                current: isTop ? 1 : 0,
                topSongId: isTop ? nextSong?._uniqueId : currentSong?._uniqueId,
            });

            previousSongRef.current = currentSong?._uniqueId;
        }, [currentSong?._uniqueId, nextSong?._uniqueId]);

        if (!dynamicBackground) {
            return null;
        }

        return (
            <AnimatePresence initial={false} mode="sync">
                {overlayState.current === 0 && (
                    <motion.div
                        animate="open"
                        className={styles.backgroundImageOverlay}
                        exit="closed"
                        initial="open"
                        key={`top-${overlayState.topSongId || 'none'}`}
                        style={
                            {
                                '--image-blur': `${dynamicImageBlur ?? 0}rem`,
                            } as CSSProperties
                        }
                        variants={overlayVariants}
                    />
                )}

                {overlayState.current === 1 && (
                    <motion.div
                        animate="open"
                        className={styles.backgroundImageOverlay}
                        exit="closed"
                        initial="open"
                        key={`bottom-${overlayState.bottomSongId || 'none'}`}
                        style={
                            {
                                '--image-blur': `${dynamicImageBlur ?? 0}rem`,
                            } as CSSProperties
                        }
                        variants={overlayVariants}
                    />
                )}
            </AnimatePresence>
        );
    },
);

BackgroundImageOverlay.displayName = 'BackgroundImageOverlay';

interface MobilePlayerContainerProps {
    children: ReactNode;
    dynamicBackground: boolean | undefined;
    dynamicIsImage: boolean | undefined;
}

const MobilePlayerContainer = memo(
    ({ children, dynamicBackground, dynamicIsImage }: MobilePlayerContainerProps) => {
        const currentSong = usePlayerSong();
        const { background } = useFastAverageColor({
            algorithm: 'dominant',
            src: currentSong?.imageUrl,
            srcLoaded: true,
        });

        let backgroundColor = mainBackground;
        if (dynamicBackground) {
            if (dynamicIsImage && background) {
                const rgbMatch = background.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgbMatch) {
                    backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.3)`;
                } else {
                    backgroundColor = background;
                }
            } else {
                backgroundColor = background || mainBackground;
            }
        }

        return (
            <motion.div
                animate="open"
                className={styles.container}
                exit="closed"
                initial="closed"
                style={{
                    backgroundColor,
                }}
                variants={mobileContainerVariants}
            >
                <BackgroundImage
                    dynamicBackground={dynamicBackground}
                    dynamicIsImage={dynamicIsImage}
                />
                {children}
            </motion.div>
        );
    },
);

MobilePlayerContainer.displayName = 'MobilePlayerContainer';

const mobileContainerVariants: Variants = {
    closed: {
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
        y: '100%',
    },
    open: {
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
        y: 0,
    },
};

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
        <MobilePlayerContainer
            dynamicBackground={dynamicBackground}
            dynamicIsImage={dynamicIsImage}
        >
            <BackgroundImageOverlay
                dynamicBackground={dynamicBackground}
                dynamicImageBlur={dynamicImageBlur}
            />
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
                <MobileFullscreenPlayerAlbumArt />
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
                <div className={styles.lyricsContent}>{isLyricsState && <Lyrics />}</div>
            </motion.div>
        </MobilePlayerContainer>
    );
};
