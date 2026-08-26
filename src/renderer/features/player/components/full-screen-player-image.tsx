import clsx from 'clsx';
import { AnimatePresence, HTMLMotionProps, motion, Variants } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './full-screen-player-image.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { SharedFullscreenPlayerMetadata } from '/@/renderer/features/player/components/shared-full-screen-player-metadata';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    PlayerItem,
    useFullScreenPlayerStore,
    useGeneralSettings,
    useNativeAspectRatio,
    usePlayerData,
    usePlayerSong,
} from '/@/renderer/store';
import { formatPartialIsoDateUTC } from '/@/renderer/utils';
import { Badge } from '/@/shared/components/badge/badge';
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
    const { t } = useTranslation();
    const mainImageRef = useRef<HTMLImageElement | null>(null);
    const [imageContainerWidth, setImageContainerWidth] = useState<null | number>(null);

    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying } = useRadioPlayer();

    const currentSong = usePlayerSong();
    const { nextSong } = usePlayerData();
    const { blurExplicitImages, playerItems } = useGeneralSettings();
    const { coverArtSize, titleDisplayType, titleLineCount } = useFullScreenPlayerStore();

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

    const isItemEnabled = (item: PlayerItem) =>
        !playerItems.find((entry) => entry.id === item)?.disabled;
    const showTitle = isItemEnabled(PlayerItem.TITLE);
    const showArtist = isItemEnabled(PlayerItem.ARTIST);
    const showAlbum = isItemEnabled(PlayerItem.ALBUM);

    // Track previous song to detect changes
    const previousSongRef = useRef<string | undefined>(currentSong?._uniqueId);
    const imageStateRef = useRef(imageState);

    const builtDataItems = {
        bit_depth: currentSong?.bitDepth && <Badge>{currentSong?.bitDepth} bit</Badge>,
        bit_rate: currentSong?.bitRate && <Badge>{currentSong?.bitRate} kbps</Badge>,
        bpm: currentSong?.bpm && (
            <Badge>
                {currentSong?.bpm} {t('common.bpm')}
            </Badge>
        ),
        codec: currentSong?.container && <Badge>{currentSong?.container}</Badge>,
        date: currentSong?.date && <Badge>{formatPartialIsoDateUTC(currentSong?.date)}</Badge>,
        disc_number: currentSong?.discNumber && (
            <Badge>
                {t('common.disc')} {currentSong?.discNumber}
            </Badge>
        ),
        genres:
            currentSong?.genres &&
            currentSong?.genres
                .slice(0, 2)
                .map((genre) => <Badge key={genre.id}>{genre.name}</Badge>),
        release_date: currentSong?.releaseDate && (
            <Badge>{formatPartialIsoDateUTC(currentSong?.releaseDate)}</Badge>
        ),
        release_type: currentSong?.tags?.releasetype && (
            <Badge>{currentSong?.tags?.releasetype[0]}</Badge>
        ),
        release_year: currentSong?.releaseYear && <Badge>{currentSong?.releaseYear}</Badge>,
        sample_rate: currentSong?.sampleRate && <Badge>{currentSong?.sampleRate / 1000} kHz</Badge>,
        track_number: currentSong?.trackNumber && (
            <Badge>
                {t('common.trackNumber')} {currentSong?.trackNumber}
            </Badge>
        ),
        year: currentSong?.year && <Badge>{currentSong?.year}</Badge>,
    };

    const showMetadata =
        playerItems.some((i) => !i.disabled && builtDataItems[i.id]) ||
        showTitle ||
        showArtist ||
        showAlbum;

    useLayoutEffect(() => {
        const updateImageContainerWidth = () => {
            if (mainImageRef.current) {
                const width = mainImageRef.current.getBoundingClientRect().width;
                setImageContainerWidth(width);
            }
        };

        updateImageContainerWidth();
        window.addEventListener('resize', updateImageContainerWidth);

        return () => window.removeEventListener('resize', updateImageContainerWidth);
    }, []);

    useLayoutEffect(() => {
        const updateImageContainerWidth = () => {
            if (mainImageRef.current) {
                const width = mainImageRef.current.getBoundingClientRect().width;
                setImageContainerWidth(width);
            }
        };

        updateImageContainerWidth();
    }, [titleDisplayType, titleLineCount, coverArtSize]);

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
            h="100%"
            justify="center"
            p="1rem"
            w="100%"
        >
            <div
                className={styles.imageContainer}
                ref={mainImageRef}
                style={{
                    marginBottom: showMetadata ? '2rem' : undefined,
                    maxHeight: `${coverArtSize}%`,
                }}
            >
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
            <SharedFullscreenPlayerMetadata imageContainerWidth={imageContainerWidth} />
        </Flex>
    );
};
