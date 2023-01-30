import { Flex, Group } from '@mantine/core';
import { HiOutlineQueueList } from 'react-icons/hi2';
import {
  RiVolumeUpFill,
  RiVolumeDownFill,
  RiVolumeMuteFill,
  RiHeartLine,
  RiHeartFill,
} from 'react-icons/ri';
import styled from 'styled-components';
import {
  useAppStoreActions,
  useCurrentServer,
  useCurrentSong,
  useMuted,
  useSetQueueFavorite,
  useSidebarStore,
  useVolume,
} from '/@/renderer/store';
import { useRightControls } from '../hooks/use-right-controls';
import { PlayerButton } from './player-button';
import { Slider } from './slider';
import { LibraryItem, ServerType } from '/@/renderer/api/types';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { Rating } from '/@/renderer/components';

const RightControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
`;

const VolumeSliderWrapper = styled.div`
  display: flex;
  gap: 0.3rem;
  align-items: center;
  width: 90px;
`;

const MetadataStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
`;

export const RightControls = () => {
  const volume = useVolume();
  const muted = useMuted();
  const server = useCurrentServer();
  const currentSong = useCurrentSong();
  const { setSidebar } = useAppStoreActions();
  const { rightExpanded: isQueueExpanded } = useSidebarStore();
  const { handleVolumeSlider, handleVolumeSliderState, handleMute } = useRightControls();

  const addToFavoritesMutation = useCreateFavorite();
  const removeFromFavoritesMutation = useDeleteFavorite();
  const setFavorite = useSetQueueFavorite();

  const handleAddToFavorites = () => {
    if (!currentSong) return;

    addToFavoritesMutation.mutate(
      {
        query: {
          id: [currentSong.id],
          type: LibraryItem.SONG,
        },
      },
      {
        onSuccess: () => {
          setFavorite([currentSong.id], true);
        },
      },
    );
  };

  const handleRemoveFromFavorites = () => {
    if (!currentSong) return;

    removeFromFavoritesMutation.mutate(
      {
        query: {
          id: [currentSong.id],
          type: LibraryItem.SONG,
        },
      },
      {
        onSuccess: () => {
          setFavorite([currentSong.id], false);
        },
      },
    );
  };

  const handleToggleFavorite = () => {
    if (!currentSong) return;

    if (currentSong.userFavorite) {
      handleRemoveFromFavorites();
    } else {
      handleAddToFavorites();
    }
  };

  const isSongDefined = Boolean(currentSong?.id);
  const showRating = isSongDefined && server?.type === ServerType.NAVIDROME;

  return (
    <Flex
      align="flex-end"
      direction="column"
      h="100%"
      p="1rem"
    >
      {showRating && (
        <Group>
          <Rating
            readOnly
            size="sm"
            value={currentSong?.userRating ?? 0}
          />
        </Group>
      )}
      <RightControlsContainer>
        <Group spacing="xs">
          <PlayerButton
            icon={
              currentSong?.userFavorite ? (
                <RiHeartFill
                  color="var(--primary-color)"
                  size="1.3rem"
                />
              ) : (
                <RiHeartLine size="1.3rem" />
              )
            }
            sx={{
              svg: {
                fill: !currentSong?.userFavorite ? undefined : 'var(--primary-color) !important',
              },
            }}
            tooltip={{
              label: currentSong?.userFavorite ? 'Unfavorite' : 'Favorite',
              openDelay: 500,
            }}
            variant="secondary"
            onClick={handleToggleFavorite}
          />
          <PlayerButton
            icon={<HiOutlineQueueList size="1.3rem" />}
            tooltip={{ label: 'View queue', openDelay: 500 }}
            variant="secondary"
            onClick={() => setSidebar({ rightExpanded: !isQueueExpanded })}
          />
        </Group>
        <MetadataStack>
          <VolumeSliderWrapper>
            <PlayerButton
              icon={
                muted ? (
                  <RiVolumeMuteFill size="1.2rem" />
                ) : volume > 50 ? (
                  <RiVolumeUpFill size="1.2rem" />
                ) : (
                  <RiVolumeDownFill size="1.2rem" />
                )
              }
              tooltip={{ label: muted ? 'Muted' : volume, openDelay: 500 }}
              variant="secondary"
              onClick={handleMute}
            />
            <Slider
              hasTooltip
              height="60%"
              max={100}
              min={0}
              value={volume}
              onAfterChange={handleVolumeSliderState}
              onChange={handleVolumeSlider}
            />
          </VolumeSliderWrapper>
        </MetadataStack>
      </RightControlsContainer>
    </Flex>
  );
};
