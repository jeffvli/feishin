import React from 'react';
import { Center } from '@mantine/core';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { RiArrowUpSLine, RiDiscLine } from 'react-icons/ri';
import { generatePath, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Text } from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStoreActions, useAppStore, useCurrentSong } from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';

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
  gap: 0;
  justify-content: center;
  width: 100%;
  overflow: hidden;
`;

const Image = styled(motion(Link))`
  width: 60px;
  height: 60px;
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
  object-fit: cover;
`;

const LineItem = styled.div<{ $secondary?: boolean }>`
  display: inline-block;
  width: 95%;
  max-width: 20vw;
  overflow: hidden;
  color: ${(props) => props.$secondary && 'var(--main-fg-secondary)'};
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;

  a {
    color: ${(props) => props.$secondary && 'var(--text-secondary)'};
  }
`;

export const LeftControls = () => {
  const { setSidebar } = useAppStoreActions();
  const hideImage = useAppStore((state) => state.sidebar.image);
  const currentSong = useCurrentSong();
  const title = currentSong?.name;
  const artists = currentSong?.artists;

  return (
    <LeftControlsContainer>
      <LayoutGroup>
        <AnimatePresence
          initial={false}
          mode="wait"
        >
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
                {currentSong?.imageUrl ? (
                  <PlayerbarImage
                    loading="eager"
                    src={currentSong?.imageUrl}
                  />
                ) : (
                  <>
                    <Center
                      sx={{
                        background: 'var(--placeholder-bg)',
                        height: '100%',
                      }}
                    >
                      <RiDiscLine
                        color="var(--placeholder-fg)"
                        size={50}
                      />
                    </Center>
                  </>
                )}

                <Button
                  compact
                  opacity={0.8}
                  radius={50}
                  size="xs"
                  sx={{ position: 'absolute', right: 2, top: 2 }}
                  tooltip={{ label: 'Expand' }}
                  variant="default"
                  onClick={(e) => {
                    e.preventDefault();
                    setSidebar({ image: true });
                  }}
                >
                  <RiArrowUpSLine
                    color="white"
                    size={20}
                  />
                </Button>
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
                  <Text
                    $link
                    $secondary
                    size="xs"
                    style={{ display: 'inline-block' }}
                  >
                    ,
                  </Text>
                )}{' '}
                <Text
                  $link
                  component={Link}
                  overflow="hidden"
                  size="xs"
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
              size="xs"
              to={
                currentSong?.albumId
                  ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                      albumId: currentSong.albumId,
                    })
                  : ''
              }
              weight={500}
            >
              {currentSong?.album || '—'}
            </Text>
          </LineItem>
        </MetadataStack>
      </LayoutGroup>
    </LeftControlsContainer>
  );
};
