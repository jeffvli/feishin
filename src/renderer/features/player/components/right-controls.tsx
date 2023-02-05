import { MouseEvent } from 'react';
import { Flex, Group } from '@mantine/core';
import { HiOutlineQueueList } from 'react-icons/hi2';
import {
  RiVolumeUpFill,
  RiVolumeDownFill,
  RiVolumeMuteFill,
  RiHeartLine,
  RiHeartFill,
} from 'react-icons/ri';
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
import { LibraryItem, ServerType } from '/@/renderer/api/types';
import { useCreateFavorite, useDeleteFavorite, useUpdateRating } from '/@/renderer/features/shared';
import { Rating } from '/@/renderer/components';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';

export const RightControls = () => {
  const volume = useVolume();
  const muted = useMuted();
  const server = useCurrentServer();
  const currentSong = useCurrentSong();
  const { setSidebar } = useAppStoreActions();
  const { rightExpanded: isQueueExpanded } = useSidebarStore();
  const { handleVolumeSlider, handleVolumeWheel, handleMute } = useRightControls();

  const updateRatingMutation = useUpdateRating();
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

  const handleUpdateRating = (rating: number) => {
    if (!currentSong) return;

    updateRatingMutation.mutate({
      _serverId: currentSong?.serverId,
      query: {
        item: [currentSong],
        rating,
      },
    });
  };

  const handleClearRating = (_e: MouseEvent<HTMLDivElement>, rating?: number) => {
    if (!currentSong || !rating) return;

    updateRatingMutation.mutate({
      _serverId: currentSong?.serverId,
      query: {
        item: [currentSong],
        rating: 0,
      },
    });
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
      px="1rem"
      py="0.5rem"
    >
      <Group h="calc(100% / 3)">
        {showRating && (
          <Rating
            size="sm"
            value={currentSong?.userRating || 0}
            onChange={handleUpdateRating}
            onClick={handleClearRating}
          />
        )}
      </Group>
      <Group
        noWrap
        align="center"
        spacing="xs"
      >
        <PlayerButton
          icon={
            currentSong?.userFavorite ? (
              <RiHeartFill
                color="var(--primary-color)"
                size="1.1rem"
              />
            ) : (
              <RiHeartLine size="1.1rem" />
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
          icon={<HiOutlineQueueList size="1.1rem" />}
          tooltip={{ label: 'View queue', openDelay: 500 }}
          variant="secondary"
          onClick={() => setSidebar({ rightExpanded: !isQueueExpanded })}
        />
        <Group
          noWrap
          spacing="xs"
        >
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
          <PlayerbarSlider
            max={100}
            min={0}
            size={6}
            value={volume}
            w="60px"
            onChange={handleVolumeSlider}
            onWheel={handleVolumeWheel}
          />
        </Group>
      </Group>
      <Group h="calc(100% / 3)" />
    </Flex>
  );
};
