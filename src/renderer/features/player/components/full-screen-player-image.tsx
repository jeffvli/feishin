import { Flex, Stack, Group } from '@mantine/core';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Badge, Text, TextTitle } from '/@/renderer/components';
import { useFastAverageColor } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentSong } from '/@/renderer/store';

const Image = styled(motion.img)`
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 5px;
`;

const ImageContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  aspect-ratio: 1/1;
  box-shadow: 2px 2px 10px 2px rgba(0, 0, 0, 40%);
`;

export const FullScreenPlayerImage = () => {
  const currentSong = useCurrentSong();
  const scaledImageUrl = currentSong?.imageUrl
    ?.replace(/&size=\d+/, '&size=800')
    .replace(/\?width=\d+/, '?width=800')
    .replace(/&height=\d+/, '&height=800');

  const background = useFastAverageColor(currentSong?.imageUrl, true, 'dominant');
  const imageKey = `image-${background}`;

  const imageVariants: Variants = {
    closed: {},
    open: {
      opacity: 1,
      transition: {
        duration: 1,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <Flex
      align="center"
      className="full-screen-player-image-container"
      direction="column"
      justify="center"
      sx={{ flex: 0.5, gap: '1rem' }}
    >
      <AnimatePresence
        initial={false}
        mode="wait"
      >
        <ImageContainer>
          <Image
            key={imageKey}
            animate="open"
            className="full-screen-player-image"
            draggable={false}
            exit="closed"
            initial="closed"
            src={scaledImageUrl}
            variants={imageVariants}
          />
        </ImageContainer>
      </AnimatePresence>
      <Stack spacing="sm">
        <TextTitle
          align="center"
          order={1}
          overflow="hidden"
          w="100%"
          weight={900}
        >
          {currentSong?.name}
        </TextTitle>
        <TextTitle
          $link
          align="center"
          component={Link}
          order={2}
          overflow="hidden"
          to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
            albumId: currentSong?.albumId || '',
          })}
          w="100%"
          weight={600}
        >
          {currentSong?.album}{' '}
        </TextTitle>
        {currentSong?.artists?.map((artist, index) => (
          <TextTitle
            key={`fs-artist-${artist.id}`}
            align="center"
            order={4}
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
              to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                albumArtistId: artist.id,
              })}
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
          {currentSong?.releaseYear && <Badge size="lg">{currentSong?.releaseYear}</Badge>}
        </Group>
      </Stack>
    </Flex>
  );
};
