import { useSetState } from '@mantine/hooks';
import clsx from 'clsx';
import { AnimatePresence, HTMLMotionProps, motion, Variants } from 'motion/react';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import styles from './full-screen-player-image.module.css';

import { useFastAverageColor } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayerData, usePlayerStore } from '/@/renderer/store';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { Badge } from '/@/shared/components/badge/badge';
import { Center } from '/@/shared/components/center/center';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Image } from '/@/shared/components/image/image';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { PlayerData, QueueSong } from '/@/shared/types/domain-types';

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

const scaleImageUrl = (imageSize: number, url?: null | string) => {
    return url
        ?.replace(/&size=\d+/, `&size=${imageSize}`)
        .replace(/\?width=\d+/, `?width=${imageSize}`)
        .replace(/&height=\d+/, `&height=${imageSize}`);
};

const MotionImage = motion.create(Image);

const ImageWithPlaceholder = ({ ...props }: HTMLMotionProps<'img'> & { placeholder?: string }) => {
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
                <Icon
                    color="muted"
                    icon="itemAlbum"
                    size="25%"
                />
            </Center>
        );
    }

    return (
        <MotionImage
            className={styles.image}
            {...props}
        />
    );
};

export const FullScreenPlayerImage = () => {
    const mainImageRef = useRef<HTMLImageElement | null>(null);
    const [mainImageDimensions, setMainImageDimensions] = useState({ idealSize: 1 });

    const albumArtRes = useSettingsStore((store) => store.general.albumArtRes);

    const { queue } = usePlayerData();
    const currentSong = queue.current;
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: queue.current?.imageUrl,
        srcLoaded: true,
    });
    const imageKey = `image-${background}`;
    const [imageState, setImageState] = useSetState({
        bottomImage: scaleImageUrl(mainImageDimensions.idealSize, queue.next?.imageUrl),
        current: 0,
        topImage: scaleImageUrl(mainImageDimensions.idealSize, queue.current?.imageUrl),
    });

    const updateImageSize = useCallback(() => {
        if (mainImageRef.current) {
            setMainImageDimensions({
                idealSize:
                    albumArtRes ||
                    Math.ceil((mainImageRef.current as HTMLDivElement).offsetHeight / 100) * 100,
            });

            setImageState({
                bottomImage: scaleImageUrl(mainImageDimensions.idealSize, queue.next?.imageUrl),
                current: 0,
                topImage: scaleImageUrl(mainImageDimensions.idealSize, queue.current?.imageUrl),
            });
        }
    }, [mainImageDimensions.idealSize, queue, setImageState, albumArtRes]);

    useLayoutEffect(() => {
        updateImageSize();
    }, [updateImageSize]);

    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => [state.current.song, state.actions.getPlayerData().queue],
            (state) => {
                const isTop = imageState.current === 0;
                const queue = state[1] as PlayerData['queue'];

                const currentImageUrl = scaleImageUrl(
                    mainImageDimensions.idealSize,
                    queue.current?.imageUrl,
                );
                const nextImageUrl = scaleImageUrl(
                    mainImageDimensions.idealSize,
                    queue.next?.imageUrl,
                );

                setImageState({
                    bottomImage: isTop ? currentImageUrl : nextImageUrl,
                    current: isTop ? 1 : 0,
                    topImage: isTop ? nextImageUrl : currentImageUrl,
                });
            },
            { equalityFn: (a, b) => (a[0] as QueueSong)?.id === (b[0] as QueueSong)?.id },
        );

        return () => {
            unsubSongChange();
        };
    }, [imageState, mainImageDimensions.idealSize, queue, setImageState]);

    return (
        <Flex
            align="center"
            className={clsx(styles.playerContainer, 'full-screen-player-image-container')}
            direction="column"
            justify="flex-start"
            p="1rem"
        >
            <div
                className={styles.imageContainer}
                ref={mainImageRef}
            >
                <AnimatePresence
                    initial={false}
                    mode="sync"
                >
                    {imageState.current === 0 && (
                        <ImageWithPlaceholder
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: imageState.current === 0 }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            key={imageKey}
                            placeholder="var(--theme-colors-foreground-muted)"
                            src={imageState.topImage || ''}
                            variants={imageVariants}
                        />
                    )}

                    {imageState.current === 1 && (
                        <ImageWithPlaceholder
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: imageState.current === 1 }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            key={imageKey}
                            placeholder="var(--theme-colors-foreground-muted)"
                            src={imageState.bottomImage || ''}
                            variants={imageVariants}
                        />
                    )}
                </AnimatePresence>
            </div>
            <Stack
                className={styles.metadataContainer}
                gap="xs"
                maw="100%"
            >
                <TextTitle
                    fw={900}
                    order={1}
                    overflow="hidden"
                    w="100%"
                >
                    {currentSong?.name}
                </TextTitle>
                <TextTitle
                    component={Link}
                    fw={600}
                    isLink
                    order={3}
                    overflow="hidden"
                    style={{
                        textShadow: 'var(--theme-fullscreen-player-text-shadow)',
                    }}
                    to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                        albumId: currentSong?.albumId || '',
                    })}
                    w="100%"
                >
                    {currentSong?.album}{' '}
                </TextTitle>
                <TextTitle
                    key="fs-artists"
                    order={3}
                    style={{
                        textShadow: 'var(--theme-fullscreen-player-text-shadow)',
                    }}
                >
                    {currentSong?.artists?.map((artist, index) => (
                        <Fragment key={`fs-artist-${artist.id}`}>
                            {index > 0 && (
                                <Text
                                    isMuted
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
                                fw={600}
                                isLink
                                isMuted
                                style={{
                                    textShadow: 'var(--theme-fullscreen-player-text-shadow)',
                                }}
                                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                    albumArtistId: artist.id,
                                })}
                            >
                                {artist.name}
                            </Text>
                        </Fragment>
                    ))}
                </TextTitle>
                <Group
                    justify="center"
                    mt="sm"
                >
                    {currentSong?.container && (
                        <Badge size="lg">
                            {currentSong?.container} {currentSong?.bitRate}
                        </Badge>
                    )}
                    {currentSong?.releaseYear && (
                        <Badge size="lg">{currentSong?.releaseYear}</Badge>
                    )}
                </Group>
            </Stack>
        </Flex>
    );
};
