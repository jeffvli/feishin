import clsx from 'clsx';
import { AnimatePresence, HTMLMotionProps, motion, Variants } from 'motion/react';
import { useEffect, useRef } from 'react';

import styles from './full-screen-player-image.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    useGeneralSettings,
    useNativeAspectRatio,
    usePlayerData,
    usePlayerSong,
} from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Flex } from '/@/shared/components/flex/flex';
import { Icon } from '/@/shared/components/icon/icon';
import { useSetState } from '/@/shared/hooks/use-set-state';
import { ExplicitStatus, LibraryItem } from '/@/shared/types/domain-types';

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
    explicit,
    placeholderIcon = 'itemAlbum',
    ...props
}: HTMLMotionProps<'img'> & {
    explicit?: boolean;
    placeholder?: string;
    placeholderIcon?: 'itemAlbum' | 'radio';
}) => {
    const nativeAspectRatio = useNativeAspectRatio();

    if (!props.src) {
        return (
            <Center
                style={{
                    background: 'var(--theme-colors-surface)',
                    borderRadius: 'var(--theme-card-default-radius)',
                    height: '100%',
                    width: '100%',
                }}
            >
                <Icon color="muted" icon={placeholderIcon} size="25%" />
            </Center>
        );
    }

    return (
        <MotionImage
            className={clsx(styles.image, className, {
                [styles.censored]: explicit,
            })}
            style={{
                objectFit: nativeAspectRatio ? 'contain' : 'cover',
                width: nativeAspectRatio ? 'auto' : '100%',
            }}
            {...props}
        />
    );
};

export const FullScreenPlayerImage = () => {
    const mainImageRef = useRef<HTMLImageElement | null>(null);

    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying } = useRadioPlayer();

    const currentSong = usePlayerSong();
    const { nextSong } = usePlayerData();
    const { blurExplicitImages } = useGeneralSettings();

    const isPlayingRadio = isRadioActive && isRadioPlaying;

    const currentImageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        itemType: LibraryItem.SONG,
        serverId: currentSong?._serverId,
        type: 'fullScreenPlayer',
    });

    const nextImageUrl = useItemImageUrl({
        id: nextSong?.imageId || undefined,
        itemType: LibraryItem.SONG,
        serverId: nextSong?._serverId,
        type: 'fullScreenPlayer',
    });

    const [imageState, setImageState] = useSetState({
        bottomExplicit: nextSong?.explicitStatus === ExplicitStatus.EXPLICIT,
        bottomImage: nextImageUrl,
        current: 0,
        topExplicit: currentSong?.explicitStatus === ExplicitStatus.EXPLICIT,
        topImage: currentImageUrl,
    });

    // Track previous song to detect changes
    const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
    const imageStateRef = useRef(imageState);

    // Keep ref in sync
    useEffect(() => {
        imageStateRef.current = imageState;
    }, [imageState]);

    // Update images when song or size changes (skip when playing radio - no album art)
    useEffect(() => {
        if (isPlayingRadio) {
            return;
        }
        if (currentSong?._uniqueId === previousSongRef.current) {
            return;
        }

        const isTop = imageStateRef.current.current === 0;

        setImageState({
            bottomExplicit:
                (isTop ? currentSong?.explicitStatus : nextSong?.explicitStatus) ===
                ExplicitStatus.EXPLICIT,
            bottomImage: isTop ? currentImageUrl : nextImageUrl,
            current: isTop ? 1 : 0,
            topExplicit:
                (isTop ? nextSong?.explicitStatus : currentSong?.explicitStatus) ===
                ExplicitStatus.EXPLICIT,
            topImage: isTop ? nextImageUrl : currentImageUrl,
        });

        previousSongRef.current = currentSong?._uniqueId;
    }, [
        isPlayingRadio,
        currentSong?._uniqueId,
        currentImageUrl,
        nextSong?._uniqueId,
        nextImageUrl,
        setImageState,
        currentSong?.explicitStatus,
        nextSong?.explicitStatus,
    ]);

    return (
        <Flex
            align="center"
            className={clsx(styles.playerContainer, 'full-screen-player-image-container')}
            direction="column"
            justify="flex-start"
            p="1rem"
        >
            <div className={styles.imageContainer} ref={mainImageRef}>
                <AnimatePresence initial={false} mode="sync">
                    {!isPlayingRadio && imageState.current === 0 && (
                        <ImageWithPlaceholder
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: imageState.current === 0 }}
                            draggable={false}
                            exit="closed"
                            explicit={blurExplicitImages && imageState.topExplicit}
                            initial="closed"
                            key={`top-${currentSong?._uniqueId || 'none'}`}
                            placeholder="var(--theme-colors-foreground-muted)"
                            src={imageState.topImage || ''}
                            variants={imageVariants}
                        />
                    )}

                    {!isPlayingRadio && imageState.current === 1 && (
                        <ImageWithPlaceholder
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: imageState.current === 1 }}
                            draggable={false}
                            exit="closed"
                            explicit={blurExplicitImages && imageState.bottomExplicit}
                            initial="closed"
                            key={`bottom-${currentSong?._uniqueId || 'none'}`}
                            placeholder="var(--theme-colors-foreground-muted)"
                            src={imageState.bottomImage || ''}
                            variants={imageVariants}
                        />
                    )}

                    {isPlayingRadio && (
                        <ImageWithPlaceholder
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: true }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            key="radio"
                            placeholder="var(--theme-colors-foreground-muted)"
                            placeholderIcon="radio"
                            src=""
                            variants={imageVariants}
                        />
                    )}
                </AnimatePresence>
            </div>
        </Flex>
    );
};
