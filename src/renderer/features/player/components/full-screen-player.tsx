import clsx from 'clsx';
import { AnimatePresence, motion, Variants } from 'motion/react';
import {
    CSSProperties,
    memo,
    ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useLocation } from 'react-router';

import styles from './full-screen-player.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { FullScreenPlayerImage } from '/@/renderer/features/player/components/full-screen-player-image';
import {
    FullScreenPlayerControls,
    FullScreenPlayerQueue,
} from '/@/renderer/features/player/components/full-screen-player-queue';
import { SharedFullscreenPlayerSettings } from '/@/renderer/features/player/components/shared-full-screen-player-settings';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { useFastAverageColor } from '/@/renderer/hooks';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useImagePlaceholderPriority,
    usePlayerData,
    usePlayerSong,
} from '/@/renderer/store';
import { Group } from '/@/shared/components/group/group';
import { useImageHashUrl } from '/@/shared/hooks/use-image-hash-url';
import { ExplicitStatus, LibraryItem, QueueSong } from '/@/shared/types/domain-types';

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

    const currentImageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    const nextImageUrl = useItemImageUrl({
        id: nextSong?.imageId || undefined,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    // Hash previews are free (no network fetch), so they are preferred for the background
    const imagePlaceholderPriority = useImagePlaceholderPriority();
    const currentHashUrl = useImageHashUrl(
        currentSong?.thumbHash,
        currentSong?.blurHash,
        imagePlaceholderPriority,
    );
    const nextHashUrl = useImageHashUrl(
        nextSong?.thumbHash,
        nextSong?.blurHash,
        imagePlaceholderPriority,
    );

    const [imageState, setImageState] = useState({
        bottomHash: nextHashUrl,
        bottomImage: nextImageUrl,
        current: 0,
        topHash: currentHashUrl,
        topImage: currentImageUrl,
    });

    const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
    const imageStateRef = useRef(imageState);

    // Keep ref in sync
    useEffect(() => {
        imageStateRef.current = imageState;
    }, [imageState]);

    // Update images when song changes
    useEffect(() => {
        if (currentSong?._uniqueId === previousSongRef.current) {
            return;
        }

        const isTop = imageStateRef.current.current === 0;

        setImageState({
            bottomHash: isTop ? currentHashUrl : nextHashUrl,
            bottomImage: isTop ? currentImageUrl : nextImageUrl,
            current: isTop ? 1 : 0,
            topHash: isTop ? nextHashUrl : currentHashUrl,
            topImage: isTop ? nextImageUrl : currentImageUrl,
        });

        previousSongRef.current = currentSong?._uniqueId;
    }, [
        currentSong?._uniqueId,
        currentHashUrl,
        currentImageUrl,
        nextSong?._uniqueId,
        nextHashUrl,
        nextImageUrl,
    ]);

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

    // Explicit songs keep the fetched background; everyone else gets the instant hash preview
    const getBackgroundStyle = (
        song: QueueSong | undefined,
        hashUrl: null | string,
        imageUrl: string | undefined,
    ) => {
        if (hashUrl && song?.explicitStatus !== ExplicitStatus.EXPLICIT) {
            return { backgroundImage: `url("${hashUrl}")` } as CSSProperties;
        }

        return {
            backgroundImage: imageUrl
                ? `url("${getBackgroundImageUrl(imageUrl, song?.id, song?.albumId)}"), url("${imageUrl}")`
                : undefined,
        } as CSSProperties;
    };

    // Determine which song IDs to use for keys and image URLs
    const topSongId = imageState.current === 0 ? currentSong?._uniqueId : nextSong?._uniqueId;
    const bottomSongId = imageState.current === 0 ? nextSong?._uniqueId : currentSong?._uniqueId;
    const topSong = imageState.current === 0 ? currentSong : nextSong;
    const bottomSong = imageState.current === 0 ? nextSong : currentSong;

    return (
        <AnimatePresence initial={false} mode="sync">
            {imageState.current === 0 && (imageState.topHash || imageState.topImage) && (
                <motion.div
                    animate="open"
                    className={styles.backgroundImage}
                    custom={{ isOpen: imageState.current === 0 }}
                    exit="closed"
                    initial="closed"
                    key={`top-${topSongId || 'none'}`}
                    style={getBackgroundStyle(topSong, imageState.topHash, imageState.topImage)}
                    variants={backgroundImageVariants}
                />
            )}

            {imageState.current === 1 && (imageState.bottomHash || imageState.bottomImage) && (
                <motion.div
                    animate="open"
                    className={styles.backgroundImage}
                    custom={{ isOpen: imageState.current === 1 }}
                    exit="closed"
                    initial="closed"
                    key={`bottom-${bottomSongId || 'none'}`}
                    style={getBackgroundStyle(
                        bottomSong,
                        imageState.bottomHash,
                        imageState.bottomImage,
                    )}
                    variants={backgroundImageVariants}
                />
            )}
        </AnimatePresence>
    );
});

BackgroundImage.displayName = 'BackgroundImage';

interface BackgroundImageOverlayProps {
    dynamicBackground: boolean | undefined;
    dynamicImageBlur: number | undefined;
}

const BackgroundImageOverlay = memo(
    ({ dynamicBackground, dynamicImageBlur }: BackgroundImageOverlayProps) => {
        if (!dynamicBackground) {
            return null;
        }

        return (
            <div
                className={styles.backgroundImageOverlay}
                style={
                    {
                        '--image-blur': `${dynamicImageBlur ?? 0}rem`,
                    } as CSSProperties
                }
            />
        );
    },
);

BackgroundImageOverlay.displayName = 'BackgroundImageOverlay';

interface BackgroundOverlayProps {
    dynamicBackground: boolean | undefined;
    opacity: number;
}

const BackgroundOverlay = memo(({ dynamicBackground, opacity }: BackgroundOverlayProps) => {
    if (!dynamicBackground) {
        return null;
    }

    // Opacity is divided by 120 instead of 100, to prevent a complete black background at maximum opacity
    const alpha = Math.min(1, Math.max(0, opacity / 120));

    return (
        <div
            className={styles.backgroundOverlay}
            style={{ backgroundColor: `rgba(0, 0, 0, ${alpha})` }}
        />
    );
});

BackgroundOverlay.displayName = 'BackgroundOverlay';

const containerVariants: Variants = {
    closed: {
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
        y: '100%',
    },
    open: (custom) => {
        const { background, dynamicBackground } = custom;
        return {
            backgroundColor: dynamicBackground ? background : mainBackground,
            transition: {
                delay: 0.1,
                duration: 0.5,
                ease: 'easeOut',
            },
            y: 0,
        };
    },
};

interface PlayerContainerProps {
    children: ReactNode;
    dynamicBackground: boolean | undefined;
    dynamicIsImage: boolean | undefined;
    opacity: number;
}

const PlayerContainer = memo(
    ({ children, dynamicBackground, dynamicIsImage, opacity }: PlayerContainerProps) => {
        const currentSong = usePlayerSong();
        const isRadioActive = useIsRadioActive();
        const { currentStationArt: currentRadioStationArt } = useRadioPlayer();

        const imageId = isRadioActive ? currentRadioStationArt?.imageId : currentSong?.imageId;
        const currentImageUrl = isRadioActive
            ? currentRadioStationArt?.imageUrl
            : currentSong?.imageUrl;

        const imageUrl = useItemImageUrl({
            id: imageId || undefined,
            imageUrl: currentImageUrl,
            itemType: LibraryItem.SONG,
            type: 'itemCard',
        });
        const { background } = useFastAverageColor({
            algorithm: 'dominant',
            src: imageUrl,
            srcLoaded: true,
        });

        return (
            <motion.div
                animate="open"
                className={styles.container}
                custom={{ background, dynamicBackground }}
                exit="closed"
                initial="closed"
                transition={{ duration: 2 }}
                variants={containerVariants}
            >
                <BackgroundImage
                    dynamicBackground={dynamicBackground}
                    dynamicIsImage={dynamicIsImage}
                />
                <BackgroundOverlay dynamicBackground={dynamicBackground} opacity={opacity} />
                {children}
            </motion.div>
        );
    },
);

PlayerContainer.displayName = 'PlayerContainer';

export const FullScreenPlayer = () => {
    const { activeTab, dynamicBackground, dynamicImageBlur, dynamicIsImage, opacity } =
        useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const hasActiveModule =
        activeTab === 'queue' ||
        activeTab === 'related' ||
        activeTab === 'lyrics' ||
        activeTab === 'visualizer';

    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying } = useRadioPlayer();

    const isPlayingRadio = isRadioActive && isRadioPlaying;
    const effectiveDynamicBackground = dynamicBackground && !isPlayingRadio;

    const location = useLocation();
    const isOpenedRef = useRef<boolean | null>(null);

    useLayoutEffect(() => {
        if (isOpenedRef.current !== null) {
            setStore({ expanded: false });
        }

        isOpenedRef.current = true;
    }, [location, setStore]);

    return (
        <PlayerContainer
            dynamicBackground={effectiveDynamicBackground}
            dynamicIsImage={dynamicIsImage}
            opacity={opacity}
        >
            <Group
                className="full-screen-player-controls-container"
                gap="sm"
                p="0.5rem"
                pos="absolute"
                style={{
                    background: `rgb(var(--theme-colors-background-transparent))`,
                    left: 0,
                    top: 0,
                }}
            >
                <SharedFullscreenPlayerSettings />
            </Group>
            <BackgroundImageOverlay
                dynamicBackground={effectiveDynamicBackground}
                dynamicImageBlur={dynamicImageBlur}
            />
            <div className={styles.responsiveContainer}>
                <div
                    className={clsx(styles.imageColumn, {
                        [styles.imageColumnFull]: !hasActiveModule,
                    })}
                >
                    <FullScreenPlayerImage />
                </div>
                <FullScreenPlayerQueue />
            </div>
            <FullScreenPlayerControls />
        </PlayerContainer>
    );
};
