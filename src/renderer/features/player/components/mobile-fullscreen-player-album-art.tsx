import clsx from 'clsx';
import { AnimatePresence, HTMLMotionProps, motion, Variants } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    useFullScreenPlayerStore,
    usePlayerData,
    usePlayerSong,
    useSettingsStore,
} from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Icon } from '/@/shared/components/icon/icon';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { useSetState } from '/@/shared/hooks/use-set-state';
import { LibraryItem } from '/@/shared/types/domain-types';

const imageVariants: Variants = {
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

const MotionImage = motion.img;

const ImageWithPlaceholder = ({
    className,
    useImageAspectRatio,
    ...props
}: HTMLMotionProps<'img'> & { placeholder?: string; useImageAspectRatio?: boolean }) => {
    if (!props.src) {
        return (
            <Center
                style={{
                    background: 'var(--theme-colors-surface)',
                    borderRadius: '12px',
                    height: '100%',
                    width: '100%',
                }}
            >
                <Icon color="muted" icon="itemAlbum" size="25%" />
            </Center>
        );
    }

    return (
        <MotionImage
            className={clsx(styles.albumImage, className)}
            style={{
                objectFit: useImageAspectRatio ? 'contain' : 'cover',
                width: useImageAspectRatio ? 'auto' : '100%',
            }}
            {...props}
        />
    );
};

export const MobileFullscreenPlayerAlbumArt = () => {
    const mainImageRef = useRef<HTMLImageElement | null>(null);
    const [mainImageDimensions, setMainImageDimensions] = useState({ idealSize: 1000 });

    const albumArtRes = useSettingsStore((store) => store.general.imageRes.fullScreenPlayer);
    const { useImageAspectRatio } = useFullScreenPlayerStore();
    const currentSong = usePlayerSong();
    const { nextSong } = usePlayerData();

    const currentImageUrl = useItemImageUrl({
        id: currentSong?.id,
        itemType: LibraryItem.SONG,
        size: mainImageDimensions.idealSize,
        type: 'fullScreenPlayer',
    });

    const nextImageUrl = useItemImageUrl({
        id: nextSong?.id,
        itemType: LibraryItem.SONG,
        size: mainImageDimensions.idealSize,
        type: 'fullScreenPlayer',
    });

    const [imageState, setImageState] = useSetState({
        bottomImage: nextImageUrl,
        current: 0,
        topImage: currentImageUrl,
    });

    const updateImageSize = useCallback(() => {
        if (mainImageRef.current) {
            const idealSize =
                albumArtRes ||
                Math.ceil((mainImageRef.current as HTMLDivElement).offsetHeight / 100) * 100;

            setMainImageDimensions({ idealSize });
        }
    }, [albumArtRes]);

    useLayoutEffect(() => {
        updateImageSize();
    }, [updateImageSize]);

    // Track previous song to detect changes
    const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
    const imageStateRef = useRef(imageState);

    // Keep ref in sync
    useEffect(() => {
        imageStateRef.current = imageState;
    }, [imageState]);

    // Update images when song or size changes
    useEffect(() => {
        if (currentSong?._uniqueId === previousSongRef.current) {
            return;
        }

        const isTop = imageStateRef.current.current === 0;

        setImageState({
            bottomImage: isTop ? currentImageUrl : nextImageUrl,
            current: isTop ? 1 : 0,
            topImage: isTop ? nextImageUrl : currentImageUrl,
        });

        previousSongRef.current = currentSong?._uniqueId;
    }, [currentSong?._uniqueId, currentImageUrl, nextSong?._uniqueId, nextImageUrl, setImageState]);

    return (
        <div className={styles.imageContainer} ref={mainImageRef}>
            <div
                className={clsx(styles.image, {
                    [styles.imageNativeAspectRatio]: useImageAspectRatio,
                })}
            >
                <AnimatePresence initial={false} mode="sync">
                    {imageState.current === 0 && (
                        <ImageWithPlaceholder
                            animate="open"
                            className={PlaybackSelectors.playerCoverArt}
                            custom={{ isOpen: imageState.current === 0 }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            key={`top-${currentSong?._uniqueId || 'none'}`}
                            loading="eager"
                            placeholder="var(--theme-colors-foreground-muted)"
                            src={imageState.topImage || ''}
                            useImageAspectRatio={useImageAspectRatio}
                            variants={imageVariants}
                        />
                    )}

                    {imageState.current === 1 && (
                        <ImageWithPlaceholder
                            animate="open"
                            className={PlaybackSelectors.playerCoverArt}
                            custom={{ isOpen: imageState.current === 1 }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            key={`bottom-${currentSong?._uniqueId || 'none'}`}
                            loading="eager"
                            placeholder="var(--theme-colors-foreground-muted)"
                            src={imageState.bottomImage || ''}
                            useImageAspectRatio={useImageAspectRatio}
                            variants={imageVariants}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
