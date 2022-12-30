import type { MouseEvent } from 'react';
import { useState } from 'react';
import { Group, Image, Stack } from '@mantine/core';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { Link, generatePath } from 'react-router-dom';
import styled from 'styled-components';
import type { Album } from '/@/renderer/api/types';
import { Button } from '/@/renderer/components/button';
import { TextTitle } from '/@/renderer/components/text-title';
import { Badge } from '/@/renderer/components/badge';
import { AppRoute } from '/@/renderer/router/routes';

const Carousel = styled(motion.div)`
  position: relative;
  height: 30vh;
  min-height: 250px;

  padding: 2rem;
  overflow: hidden;
  background: linear-gradient(180deg, var(--main-bg), rgba(25, 26, 28, 60%));
`;

const Grid = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-template-areas: 'image info';
  grid-template-rows: 1fr;
  grid-template-columns: 250px 1fr;
  gap: 0.5rem;
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
  padding-left: 1rem;
`;

const BackgroundImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 150%;
  height: 150%;
  object-fit: cover;
  object-position: 0 30%;
  filter: blur(24px);
  user-select: none;
`;

const BackgroundImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(25, 26, 28, 30%), var(--main-bg));
`;

const Wrapper = styled(Link)`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const TitleWrapper = styled.div`
  display: webkit-box;
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
  const [itemIndex, setItemIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentItem = data?.[itemIndex];

  const handleNext = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDirection(1);
    setItemIndex((prev) => prev + 1);
  };

  const handlePrevious = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDirection(-1);
    setItemIndex((prev) => prev - 1);
  };

  return (
    <Wrapper to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: currentItem?.id || '' })}>
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
                  radius="sm"
                  src={data[itemIndex]?.imageUrl}
                  sx={{ objectFit: 'cover' }}
                  width={225}
                />
              </ImageColumn>
              <InfoColumn>
                <Stack sx={{ width: '100%' }}>
                  <TitleWrapper>
                    <TextTitle fw="bold">{currentItem?.name}</TextTitle>
                  </TitleWrapper>
                  <TitleWrapper>
                    {currentItem?.albumArtists.map((artist) => (
                      <TextTitle
                        key={`carousel-artist-${artist.id}`}
                        fw="600"
                        order={3}
                      >
                        {artist.name}
                      </TextTitle>
                    ))}
                  </TitleWrapper>
                  <Group>
                    {currentItem?.genres?.map((genre) => (
                      <Badge key={`carousel-genre-${genre.id}`}>{genre.name}</Badge>
                    ))}
                    <Badge>{currentItem?.releaseYear}</Badge>
                    <Badge>{currentItem?.songCount} tracks</Badge>
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
      <Group
        spacing="xs"
        sx={{ bottom: 0, position: 'absolute', right: 0, zIndex: 20 }}
      >
        <Button
          disabled={itemIndex === 0}
          px="lg"
          radius={100}
          variant="subtle"
          onClick={handlePrevious}
        >
          <RiArrowLeftSLine size={15} />
        </Button>
        <Button
          disabled={itemIndex === (data?.length || 1) - 1}
          px="lg"
          radius={100}
          variant="subtle"
          onClick={handleNext}
        >
          <RiArrowRightSLine size={15} />
        </Button>
      </Group>
    </Wrapper>
  );
};
