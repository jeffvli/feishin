import type { MouseEvent } from 'react';
import { useState } from 'react';
import { Group, Image, Stack } from '@mantine/core';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { Link, generatePath } from 'react-router-dom';
import styled from 'styled-components';
import { Album, LibraryItem } from '/@/renderer/api/types';
import { Button } from '/@/renderer/components/button';
import { TextTitle } from '/@/renderer/components/text-title';
import { Badge } from '/@/renderer/components/badge';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { Play } from '/@/renderer/types';
import { usePlayButtonBehavior } from '/@/renderer/store';

const Carousel = styled(motion.div)`
    position: relative;
    height: 35vh;
    min-height: 250px;
    padding: 2rem;
    overflow: hidden;
    background: linear-gradient(180deg, var(--main-bg), rgb(25 26 28 / 60%));
    border-radius: 1rem;
`;

const Grid = styled.div`
    display: grid;
    grid-template-areas: 'image info';
    grid-template-rows: 1fr;
    grid-template-columns: 200px minmax(0, 1fr);
    grid-auto-columns: 1fr;
    width: 100%;
    max-width: 100%;
    height: 100%;
`;

const ImageColumn = styled.div`
    z-index: 15;
    display: flex;
    grid-area: image;
    align-items: flex-end;
`;

const InfoColumn = styled.div`
    z-index: 15;
    display: flex;
    grid-area: info;
    align-items: flex-end;
    width: 100%;
    max-width: 100%;
    padding-left: 1rem;
`;

const BackgroundImage = styled.img`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    width: 150%;
    height: 150%;
    user-select: none;
    filter: blur(24px);
    object-fit: var(--image-fit);
    object-position: 0 30%;
`;

const BackgroundImageOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgb(25 26 28 / 30%), var(--main-bg));
`;

const Wrapper = styled(Link)`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const TitleWrapper = styled.div`
    /* stylelint-disable-next-line value-no-vendor-prefix */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const variants: Variants = {
    animate: {
        opacity: 1,
        transition: { opacity: { duration: 0.5 } },
    },
    exit: {
        opacity: 0,
        transition: { opacity: { duration: 0.5 } },
    },
    initial: {
        opacity: 0,
    },
};

interface FeatureCarouselProps {
    data: Album[] | undefined;
}

export const FeatureCarousel = ({ data }: FeatureCarouselProps) => {
    const { t } = useTranslation();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const [itemIndex, setItemIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const playType = usePlayButtonBehavior();

    const currentItem = data?.[itemIndex];

    const handleNext = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setDirection(1);
        if (itemIndex === (data?.length || 0) - 1 || 0) {
            setItemIndex(0);
            return;
        }

        setItemIndex((prev) => prev + 1);
    };

    const handlePrevious = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setDirection(-1);
        if (itemIndex === 0) {
            setItemIndex((data?.length || 0) - 1);
            return;
        }

        setItemIndex((prev) => prev - 1);
    };

    return (
        <Wrapper
            to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: currentItem?.id || '' })}
        >
            <AnimatePresence
                custom={direction}
                initial={false}
                mode="popLayout"
            >
                {data && (
                    <Carousel
                        key={`image-${itemIndex}`}
                        animate="animate"
                        custom={direction}
                        exit="exit"
                        initial="initial"
                        variants={variants}
                    >
                        <Grid>
                            <ImageColumn>
                                <Image
                                    height={225}
                                    placeholder="var(--card-default-bg)"
                                    radius="md"
                                    src={data[itemIndex]?.imageUrl}
                                    sx={{ objectFit: 'cover' }}
                                    width={225}
                                />
                            </ImageColumn>
                            <InfoColumn>
                                <Stack
                                    spacing="md"
                                    sx={{ width: '100%' }}
                                >
                                    <TitleWrapper>
                                        <TextTitle
                                            lh="3.5rem"
                                            order={1}
                                            overflow="hidden"
                                            sx={{ fontSize: '3.5rem' }}
                                            weight={900}
                                        >
                                            {currentItem?.name}
                                        </TextTitle>
                                    </TitleWrapper>
                                    <TitleWrapper>
                                        {currentItem?.albumArtists.slice(0, 1).map((artist) => (
                                            <TextTitle
                                                key={`carousel-artist-${artist.id}`}
                                                order={2}
                                                weight={600}
                                            >
                                                {artist.name}
                                            </TextTitle>
                                        ))}
                                    </TitleWrapper>
                                    <Group>
                                        {currentItem?.genres?.slice(0, 1).map((genre) => (
                                            <Badge
                                                key={`carousel-genre-${genre.id}`}
                                                size="lg"
                                            >
                                                {genre.name}
                                            </Badge>
                                        ))}
                                        <Badge size="lg">{currentItem?.releaseYear}</Badge>
                                        <Badge size="lg">
                                            {t('entity.trackWithCount', {
                                                count: currentItem?.songCount || 0,
                                            })}
                                        </Badge>
                                    </Group>
                                    <Group position="apart">
                                        <Button
                                            size="lg"
                                            style={{ borderRadius: '5rem' }}
                                            variant="outline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!currentItem) return;

                                                handlePlayQueueAdd?.({
                                                    byItemType: {
                                                        id: [currentItem.id],
                                                        type: LibraryItem.ALBUM,
                                                    },
                                                    playType,
                                                });
                                            }}
                                        >
                                            {t(
                                                playType === Play.NOW
                                                    ? 'player.play'
                                                    : playType === Play.NEXT
                                                      ? 'player.addNext'
                                                      : 'player.addLast',
                                                { postProcess: 'titleCase' },
                                            )}
                                        </Button>
                                        <Group spacing="sm">
                                            <Button
                                                radius="lg"
                                                size="sm"
                                                variant="outline"
                                                onClick={handlePrevious}
                                            >
                                                <RiArrowLeftSLine size="2rem" />
                                            </Button>
                                            <Button
                                                radius="lg"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleNext}
                                            >
                                                <RiArrowRightSLine size="2rem" />
                                            </Button>
                                        </Group>
                                    </Group>
                                </Stack>
                            </InfoColumn>
                        </Grid>
                        <BackgroundImage
                            draggable="false"
                            src={currentItem?.imageUrl || undefined}
                        />
                        <BackgroundImageOverlay />
                    </Carousel>
                )}
            </AnimatePresence>
        </Wrapper>
    );
};
