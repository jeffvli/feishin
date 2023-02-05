import type { MouseEvent } from 'react';
import React from 'react';
import type { UnstyledButtonProps } from '@mantine/core';
import { Group } from '@mantine/core';
import { RiPlayFill, RiMore2Fill, RiHeartFill, RiHeartLine } from 'react-icons/ri';
import styled from 'styled-components';
import { _Button } from '/@/renderer/components/button';
import type { PlayQueueAddOptions } from '/@/renderer/types';
import { Play } from '/@/renderer/types';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/renderer/api/types';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import {
  ALBUM_CONTEXT_MENU_ITEMS,
  ARTIST_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';

type PlayButtonType = UnstyledButtonProps & React.ComponentPropsWithoutRef<'button'>;

const PlayButton = styled.button<PlayButtonType>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: rgb(255, 255, 255);
  border: none;
  border-radius: 50%;
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
  transition: scale 0.2s linear;

  &:hover {
    opacity: 1;
    scale: 1.1;
  }

  &:active {
    opacity: 1;
    scale: 1;
  }

  svg {
    fill: rgb(0, 0, 0);
    stroke: rgb(0, 0, 0);
  }
`;

const SecondaryButton = styled(_Button)`
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
  transition: scale 0.2s linear;

  &:hover {
    opacity: 1;
    scale: 1.1;
  }

  &:active {
    opacity: 1;
    scale: 1;
  }
`;

const GridCardControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const ControlsRow = styled.div`
  width: 100%;
  height: calc(100% / 3);
`;

// const TopControls = styled(ControlsRow)`
//   display: flex;
//   align-items: flex-start;
//   justify-content: space-between;
//   padding: 0.5rem;
// `;

// const CenterControls = styled(ControlsRow)`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 0.5rem;
// `;

const BottomControls = styled(ControlsRow)`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1rem 0.5rem;
`;

const FavoriteWrapper = styled.span<{ isFavorite: boolean }>`
  svg {
    fill: ${(props) => props.isFavorite && 'var(--primary-color)'};
  }
`;

export const GridCardControls = ({
  itemData,
  itemType,
  handlePlayQueueAdd,
  handleFavorite,
}: {
  handleFavorite: (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem }) => void;
  handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
  itemData: any;
  itemType: LibraryItem;
}) => {
  const playButtonBehavior = useSettingsStore((state) => state.player.playButtonBehavior);

  const handlePlay = async (e: MouseEvent<HTMLButtonElement>, playType?: Play) => {
    e.preventDefault();
    e.stopPropagation();

    handlePlayQueueAdd?.({
      byItemType: {
        id: [itemData.id],
        type: itemType,
      },
      play: playType || playButtonBehavior,
    });
  };

  const handleFavorites = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    handleFavorite?.({
      id: [itemData.id],
      isFavorite: itemData.userFavorite,
      itemType,
    });
  };

  const handleContextMenu = useHandleGeneralContextMenu(
    itemType,
    itemType === LibraryItem.ALBUM ? ALBUM_CONTEXT_MENU_ITEMS : ARTIST_CONTEXT_MENU_ITEMS,
  );

  return (
    <GridCardControlsContainer>
      <BottomControls>
        <PlayButton onClick={handlePlay}>
          <RiPlayFill size={25} />
        </PlayButton>
        <Group spacing="xs">
          <SecondaryButton
            p={5}
            sx={{ svg: { fill: 'white !important' } }}
            variant="subtle"
            onClick={handleFavorites}
          >
            <FavoriteWrapper isFavorite={itemData?.isFavorite}>
              {itemData?.userFavorite ? (
                <RiHeartFill size={20} />
              ) : (
                <RiHeartLine
                  color="white"
                  size={20}
                />
              )}
            </FavoriteWrapper>
          </SecondaryButton>
          <SecondaryButton
            p={5}
            sx={{ svg: { fill: 'white !important' } }}
            variant="subtle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleContextMenu(e, [itemData]);
            }}
          >
            <RiMore2Fill
              color="white"
              size={20}
            />
          </SecondaryButton>
        </Group>
      </BottomControls>
    </GridCardControlsContainer>
  );
};
