import styled from '@emotion/styled';
import { Box, Group } from '@mantine/core';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { RiArrowUpSLine } from 'react-icons/ri';
import { generatePath, Link } from 'react-router-dom';
import { Button, Text } from '@/renderer/components';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, usePlayerStore } from '@/renderer/store';
import { fadeIn } from '@/renderer/styles';

const LeftControlsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  margin-left: 1rem;
`;

const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1rem 1rem 0;
`;

const MetadataStack = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  justify-content: center;
  width: 100%;
  overflow: hidden;
`;

const Image = styled(motion(Link))<{ url: string }>`
  ${fadeIn};
  width: 70px;
  height: 70px;
  background-image: url(${(props) => props.url});
  background-repeat: no-repeat;
  background-size: cover;
  filter: drop-shadow(0 0 5px rgb(0, 0, 0, 100%));

  button {
    display: none;
  }

  &:hover button {
    display: block;
  }
`;

const LineItem = styled(Box)<{ secondary?: boolean }>`
  display: inline-block;
  width: 95%;
  max-width: 30vw;
  overflow: hidden;
  color: ${(props) => props.secondary && 'var(--main-fg-secondary)'};
  white-space: nowrap;
  text-overflow: ellipsis;

  a {
    color: ${(props) => props.secondary && 'var(--text-secondary)'};
  }
`;

export const LeftControls = () => {
  const hideImage = useAppStore((state) => state.sidebar.image);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const song = usePlayerStore((state) => state.current.song);
  const title = song?.name;
  const artists = song?.artists;
  const album = song?.album;

  return (
    <LeftControlsContainer>
      <LayoutGroup>
        <AnimatePresence exitBeforeEnter={false} initial={false}>
          {!hideImage && (
            <ImageWrapper>
              <Image
                key="playerbar-image"
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                initial={{ opacity: 0, x: -50 }}
                to={AppRoute.NOW_PLAYING}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                url={song?.imageUrl}
              >
                <Group position="right">
                  <Button
                    compact
                    variant="subtle"
                    onClick={(e) => {
                      e.preventDefault();
                      setSidebar({ image: true });
                    }}
                  >
                    <RiArrowUpSLine color="white" size={20} />
                  </Button>
                </Group>
              </Image>
            </ImageWrapper>
          )}
        </AnimatePresence>
        <MetadataStack layout>
          <LineItem>
            <Text
              component={Link}
              overflow="hidden"
              size="sm"
              sx={{ '&:hover': { textDecoration: 'underline' } }}
              to={AppRoute.NOW_PLAYING}
              weight={500}
            >
              {title || '—'}
            </Text>
          </LineItem>
          <LineItem secondary>
            {artists?.map((artist, index) => (
              <>
                {index > 0 && (
                  <Text secondary style={{ display: 'inline-block' }}>
                    ,
                  </Text>
                )}{' '}
                <Text
                  component={Link}
                  overflow="hidden"
                  size="sm"
                  sx={{
                    '&:hover': { textDecoration: 'underline' },
                    width: 'inherit',
                  }}
                  to={
                    artist.id
                      ? generatePath(AppRoute.LIBRARY_ARTISTS_DETAIL, {
                          artistId: artist.id,
                        })
                      : ''
                  }
                  weight={500}
                >
                  {artist.name || '—'}
                </Text>
              </>
            ))}
          </LineItem>
          <LineItem secondary>
            <Text
              component={Link}
              overflow="hidden"
              size="sm"
              sx={{ '&:hover': { textDecoration: 'underline' } }}
              to={
                album?.id
                  ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                      albumId: album?.id,
                    })
                  : ''
              }
              weight={500}
            >
              {album?.name || '—'}
            </Text>
          </LineItem>
        </MetadataStack>
      </LayoutGroup>
    </LeftControlsContainer>
  );
};
