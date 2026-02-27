import clsx from 'clsx';
import { t } from 'i18next';
import { AnimatePresence, HTMLMotionProps, motion, Variants } from 'motion/react';
import { Fragment, useEffect, useRef } from 'react';
import { generatePath, Link } from 'react-router';

import styles from './full-screen-player-image.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useGeneralSettings,
    useNativeAspectRatio,
    usePlayerData,
    usePlayerSong,
} from '/@/renderer/store';
import { Badge } from '/@/shared/components/badge/badge';
import { Center } from '/@/shared/components/center/center';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
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
    const { isPlaying: isRadioPlaying, metadata: radioMetadata, stationName } = useRadioPlayer();

    const currentSong = usePlayerSong();
    const { nextSong } = usePlayerData();
    const { blurExplicitImages, playerItems } = useGeneralSettings();

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

    const builtDataItems = {
        bit_depth: currentSong?.bitDepth && <Badge>{currentSong?.bitDepth} bit</Badge>,
        bit_rate: currentSong?.bitRate && <Badge>{currentSong?.bitRate} kbps</Badge>,
        bpm: currentSong?.bpm && (
            <Badge>
                {currentSong?.bpm} {t('common.bpm')}
            </Badge>
        ),
        codec: currentSong?.container && <Badge>{currentSong?.container}</Badge>,
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
        release_date: currentSong?.releaseDate && <Badge>{currentSong?.releaseDate}</Badge>,
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
    };

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
            <Stack className={styles.metadataContainer} gap="md" maw="100%">
                <Text fw={900} lh="1.2" overflow="hidden" size="4xl" w="100%">
                    {isPlayingRadio
                        ? radioMetadata?.title || stationName || 'Radio'
                        : currentSong?.name}
                </Text>
                {isPlayingRadio ? (
                    <Text overflow="hidden" size="xl" w="100%">
                        {stationName || 'Radio'}
                    </Text>
                ) : (
                    <Text
                        component={Link}
                        isLink
                        overflow="hidden"
                        size="xl"
                        to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                            albumId: currentSong?.albumId || '',
                        })}
                        w="100%"
                    >
                        {currentSong?.album}
                    </Text>
                )}
                <Text key="fs-artists">
                    {isPlayingRadio
                        ? radioMetadata?.artist || stationName || 'Radio'
                        : currentSong?.artists?.map((artist, index) => (
                              <Fragment key={`fs-artist-${artist.id}`}>
                                  {index > 0 && (
                                      <Text
                                          style={{
                                              display: 'inline-block',
                                              padding: '0 0.5rem',
                                          }}
                                      >
                                          •
                                      </Text>
                                  )}
                                  <Text
                                      component={Link}
                                      isLink
                                      to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                          albumArtistId: artist.id,
                                      })}
                                  >
                                      {artist.name}
                                  </Text>
                              </Fragment>
                          ))}
                </Text>
                {!isPlayingRadio && (
                    <Group justify="center" mt="sm">
                        {playerItems.map((i) => !i.disabled && builtDataItems[i.id])}
                    </Group>
                )}
            </Stack>
        </Flex>
    );
};
