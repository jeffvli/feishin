import React, { MouseEvent } from 'react';
import { Center, Group } from '@mantine/core';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { RiArrowUpSLine, RiDiscLine, RiMore2Fill } from 'react-icons/ri';
import { generatePath, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Text } from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';
import {
  useAppStoreActions,
  useAppStore,
  useCurrentSong,
  useSetFullScreenPlayerStore,
  useFullScreenPlayerStore,
} from '/@/renderer/store';
import { fadeIn } from '/@/renderer/styles';
import { LibraryItem } from '/@/renderer/api/types';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';

const LeftControlsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  padding-left: 1rem;
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

const Image = styled(motion.div)`
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
  const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
  const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
  const hideImage = useAppStore((state) => state.sidebar.image);
  const currentSong = useCurrentSong();
  const title = currentSong?.name;
  const artists = currentSong?.artists;

  const isSongDefined = Boolean(currentSong?.id);

  const handleGeneralContextMenu = useHandleGeneralContextMenu(
    LibraryItem.SONG,
    SONG_CONTEXT_MENU_ITEMS,
  );

  const handleToggleFullScreenPlayer = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
  };

  const handleToggleSidebarImage = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSidebar({ image: true });
  };

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
                role="button"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onClick={handleToggleFullScreenPlayer}
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
                  size="md"
                  sx={{ position: 'absolute', right: 2, top: 2 }}
                  tooltip={{ label: 'Expand', openDelay: 500 }}
                  variant="default"
                  onClick={handleToggleSidebarImage}
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
        <MetadataStack layout="position">
          <LineItem>
            <Group
              noWrap
              align="flex-start"
              spacing="xs"
            >
              <Text
                $link
                component={Link}
                overflow="hidden"
                size="md"
                to={AppRoute.NOW_PLAYING}
                weight={500}
              >
                {title || '—'}
              </Text>
              {isSongDefined && (
                <Button
                  compact
                  variant="subtle"
                  onClick={(e) => handleGeneralContextMenu(e, [currentSong!])}
                >
                  <RiMore2Fill size="1.2rem" />
                </Button>
              )}
            </Group>
          </LineItem>
          <LineItem $secondary>
            {artists?.map((artist, index) => (
              <React.Fragment key={`bar-${artist.id}`}>
                {index > 0 && (
                  <Text
                    $link
                    $secondary
                    size="md"
                    style={{ display: 'inline-block' }}
                  >
                    ,
                  </Text>
                )}{' '}
                <Text
                  $link
                  component={Link}
                  overflow="hidden"
                  size="md"
                  to={
                    artist.id
                      ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                          albumArtistId: artist.id,
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
              size="md"
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
