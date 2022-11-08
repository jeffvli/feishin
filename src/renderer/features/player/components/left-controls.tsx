import React from 'react';
import { Center, Group } from '@mantine/core';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { RiArrowUpSLine, RiDiscLine } from 'react-icons/ri';
import { generatePath, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Text } from '@/renderer/components';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, useAuthStore, usePlayerStore } from '@/renderer/store';
import { fadeIn } from '@/renderer/styles';
import { ServerType } from '@/renderer/types';

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

const Image = styled(motion(Link))`
  width: 70px;
  height: 70px;
  filter: drop-shadow(0 0 5px rgb(0, 0, 0, 100%));

  ${fadeIn};
  animation: fadein 0.2s ease-in-out;

  button {
    display: none;
  }

  &:hover button {
    display: block;
  }
`;

const PlayerbarImage = styled.img`
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: cover;
`;

const LineItem = styled.div<{ $secondary?: boolean }>`
  display: inline-block;
  width: 95%;
  max-width: 30vw;
  overflow: hidden;
  color: ${(props) => props.$secondary && 'var(--main-fg-secondary)'};
  white-space: nowrap;
  text-overflow: ellipsis;

  a {
    color: ${(props) => props.$secondary && 'var(--text-secondary)'};
  }
`;

export const LeftControls = () => {
  const hideImage = useAppStore((state) => state.sidebar.image);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const serverType = useAuthStore((state) => state.currentServer?.type);
  const song = usePlayerStore((state) => state.current.song);

  const title = song?.name;

  const artists =
    serverType === ServerType.JELLYFIN
      ? song?.artists
      : song?.album?.albumArtists;

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
              >
                {song?.imageUrl ? (
                  <PlayerbarImage loading="eager" src={song?.imageUrl} />
                ) : (
                  <>
                    <Center
                      sx={{
                        background: 'var(--placeholder-bg)',
                        height: '100%',
                      }}
                    >
                      <RiDiscLine color="var(--placeholder-fg)" size={50} />
                    </Center>
                  </>
                )}

                <Group
                  position="right"
                  sx={{ position: 'absolute', right: 0, top: 0 }}
                >
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
              $link
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
          <LineItem $secondary>
            {artists?.map((artist, index) => (
              <React.Fragment key={`bar-${artist.id}`}>
                {index > 0 && (
                  <Text $secondary style={{ display: 'inline-block' }}>
                    ,
                  </Text>
                )}{' '}
                <Text
                  $link
                  component={Link}
                  overflow="hidden"
                  size="sm"
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
              </React.Fragment>
            ))}
          </LineItem>
          <LineItem $secondary>
            <Text
              $link
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
