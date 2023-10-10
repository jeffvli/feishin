import { Flex, Stack, Group, Center } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { AnimatePresence, HTMLMotionProps, motion, Variants } from 'framer-motion';
import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { RiAlbumFill } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { QueueSong } from '/@/renderer/api/types';
import { Badge, Text, TextTitle } from '/@/renderer/components';
import { useFastAverageColor } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import {
    PlayerData,
    useFullScreenPlayerStore,
    usePlayerData,
    usePlayerStore,
} from '/@/renderer/store';

const Image = styled(motion.img)<{ $useAspectRatio: boolean }>`
    position: absolute;
    max-width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 5px rgb(0 0 0 / 40%)) drop-shadow(0 0 5px rgb(0 0 0 / 40%));
    border-radius: 5px;
    object-fit: ${({ $useAspectRatio }) => ($useAspectRatio ? 'contain' : 'cover')};
    object-position: 50% 100%;
`;

const ImageContainer = styled(motion.div)`
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    max-width: 100%;
    height: 65%;
    aspect-ratio: 1/1;
    margin-bottom: 1rem;
`;

interface TransparentMetadataContainer {
    opacity: number;
}

const MetadataContainer = styled(Stack)<TransparentMetadataContainer>`
    padding: 1rem;
    border-radius: 5px;

    h1 {
        font-size: 3.5vh;
    }
`;

const PlayerContainer = styled(Flex)`
    @media screen and (height <= 640px) {
        .full-screen-player-image-metadata {
            display: none;
            height: 100%;
            margin-bottom: 0;
        }

        ${ImageContainer} {
            height: 100%;
            margin-bottom: 0;
        }
    }
`;

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

const scaleImageUrl = (imageSize: number, url?: string | null) => {
    return url
        ?.replace(/&size=\d+/, '&size='+imageSize)
        .replace(/\?width=\d+/, '?width='+imageSize)
        .replace(/&height=\d+/, '&height='+imageSize);
};

const ImageWithPlaceholder = ({
    useAspectRatio,
    ...props
}: HTMLMotionProps<'img'> & { useAspectRatio: boolean }) => {
    if (!props.src) {
        return (
            <Center
                sx={{
                    background: 'var(--placeholder-bg)',
                    borderRadius: 'var(--card-default-radius)',
                    height: '100%',
                    width: '100%',
                }}
            >
                <RiAlbumFill
                    color="var(--placeholder-fg)"
                    size="25%"
                />
            </Center>
        );
    }

    return (
        <Image
            $useAspectRatio={useAspectRatio}
            {...props}
        />
    );
};

export const FullScreenPlayerImage = () => {
    const mainImageRef = useRef();
    const [mainImageDimensions, setMainImageDimensions] = useState({ idealSize: 1 });

    const { queue } = usePlayerData();
    const { opacity, useImageAspectRatio } = useFullScreenPlayerStore();
    const currentSong = queue.current;
    const { color: background } = useFastAverageColor({
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

    const updateImageSize = ()=>{
      if (mainImageRef.current) {
        setMainImageDimensions({
            idealSize: Math.ceil(mainImageRef.current.offsetHeight / 100) * 100
        });

        setImageState({
            bottomImage: scaleImageUrl(mainImageDimensions.idealSize, queue.next?.imageUrl),
            current: 0,
            topImage: scaleImageUrl(mainImageDimensions.idealSize, queue.current?.imageUrl),
        });
      }
    }

    useLayoutEffect(() => {
      updateImageSize();
    }, []);

    useEffect(() => {
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => [state.current.song, state.actions.getPlayerData().queue],
            (state) => {
                const isTop = imageState.current === 0;
                const queue = state[1] as PlayerData['queue'];

                const currentImageUrl = scaleImageUrl(mainImageDimensions.idealSize, queue.current?.imageUrl);
                const nextImageUrl = scaleImageUrl(mainImageDimensions.idealSize, queue.next?.imageUrl);

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
    }, [imageState, queue, setImageState]);

    return (
        <PlayerContainer
            align="center"
            className="full-screen-player-image-container"
            direction="column"
            justify="flex-start"
            p="1rem"
        >
            <ImageContainer ref={mainImageRef} onLoad={updateImageSize}>
                <AnimatePresence
                    initial={false}
                    mode="sync"
                >
                    {imageState.current === 0 && (
                        <ImageWithPlaceholder
                            key={imageKey}
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: imageState.current === 0 }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            placeholder="var(--placeholder-bg)"
                            src={imageState.topImage || ''}
                            useAspectRatio={useImageAspectRatio}
                            variants={imageVariants}
                        />
                    )}

                    {imageState.current === 1 && (
                        <ImageWithPlaceholder
                            key={imageKey}
                            animate="open"
                            className="full-screen-player-image"
                            custom={{ isOpen: imageState.current === 1 }}
                            draggable={false}
                            exit="closed"
                            initial="closed"
                            placeholder="var(--placeholder-bg)"
                            src={imageState.bottomImage || ''}
                            useAspectRatio={useImageAspectRatio}
                            variants={imageVariants}
                        />
                    )}
                </AnimatePresence>
            </ImageContainer>
            <MetadataContainer
                className="full-screen-player-image-metadata"
                maw="100%"
                opacity={opacity}
                spacing="xs"
            >
                <TextTitle
                    align="center"
                    order={1}
                    overflow="hidden"
                    pb="0.5rem"
                    style={{
                        textShadow: '0 0 5px rgb(0 0 0 / 100%)',
                    }}
                    w="100%"
                    weight={900}
                >
                    {currentSong?.name}
                </TextTitle>
                <TextTitle
                    $link
                    align="center"
                    component={Link}
                    order={3}
                    overflow="hidden"
                    style={{
                        textShadow: '0 0 5px rgb(0 0 0 / 100%)',
                    }}
                    to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                        albumId: currentSong?.albumId || '',
                    })}
                    transform="uppercase"
                    w="100%"
                    weight={600}
                >
                    {currentSong?.album}{' '}
                </TextTitle>
                {currentSong?.artists?.map((artist, index) => (
                    <TextTitle
                        key={`fs-artist-${artist.id}`}
                        align="center"
                        order={3}
                        style={{
                            textShadow: '0 0 5px rgb(0 0 0 / 100%)',
                        }}
                        transform="uppercase"
                    >
                        {index > 0 && (
                            <Text
                                sx={{
                                    display: 'inline-block',
                                    padding: '0 0.5rem',
                                }}
                            >
                                •
                            </Text>
                        )}
                        <Text
                            $link
                            component={Link}
                            style={{
                                textShadow: '0 0 5px rgb(0 0 0 / 100%)',
                            }}
                            to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                albumArtistId: artist.id,
                            })}
                            transform="uppercase"
                            weight={600}
                        >
                            {artist.name}
                        </Text>
                    </TextTitle>
                ))}
                <Group position="center">
                    {currentSong?.container && (
                        <Badge size="lg">
                            {currentSong?.container} {currentSong?.bitRate}
                        </Badge>
                    )}
                    {currentSong?.releaseYear && (
                        <Badge size="lg">{currentSong?.releaseYear}</Badge>
                    )}
                </Group>
            </MetadataContainer>
        </PlayerContainer>
    );
};
