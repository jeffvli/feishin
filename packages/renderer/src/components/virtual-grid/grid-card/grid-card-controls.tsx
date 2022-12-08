import type { MouseEvent } from 'react';
import React from 'react';
import type { UnstyledButtonProps } from '@mantine/core';
import { Group } from '@mantine/core';
import { RiPlayFill, RiMore2Fill, RiHeartFill, RiHeartLine } from 'react-icons/ri';
import styled from 'styled-components';
import { _Button } from '/@/components/button';
import { DropdownMenu } from '/@/components/dropdown-menu';
import type { LibraryItem } from '/@/types';
import { Play } from '/@/types';
import { useSettingsStore } from '/@/store/settings.store';

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
  fill: white !important;
  svg: {
    fill: white !important;
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

const PLAY_TYPES = [
  {
    label: 'Play',
    play: Play.NOW,
  },
  {
    label: 'Play last',
    play: Play.LAST,
  },
  {
    label: 'Play next',
    play: Play.NEXT,
  },
];

export const GridCardControls = ({
  itemData,
  itemType,
}: {
  itemData: any;
  itemType: LibraryItem;
}) => {
  const playButtonBehavior = useSettingsStore((state) => state.player.playButtonBehavior);

  const handlePlay = (e: MouseEvent<HTMLButtonElement>, playType?: Play) => {
    e.preventDefault();
    e.stopPropagation();
    import('/@/features/player/utils/handle-playqueue-add').then((fn) => {
      fn.handlePlayQueueAdd({
        byItemType: {
          id: itemData.id,
          type: itemType,
        },
        play: playType || playButtonBehavior,
      });
    });
  };

  return (
    <GridCardControlsContainer>
      {/* <TopControls /> */}
      {/* <CenterControls /> */}
      <BottomControls>
        <PlayButton
          // initial="initial"
          // variants={buttonVariants}
          // whileHover="hover"
          // whileTap="pressed"
          onClick={handlePlay}
        >
          <RiPlayFill size={25} />
        </PlayButton>
        <Group spacing="xs">
          <SecondaryButton
            disabled
            p={5}
            sx={{ svg: { fill: 'white !important' } }}
            variant="subtle"
          >
            <FavoriteWrapper isFavorite={itemData?.isFavorite}>
              {itemData?.isFavorite ? (
                <RiHeartFill size={20} />
              ) : (
                <RiHeartLine
                  color="white"
                  size={20}
                />
              )}
            </FavoriteWrapper>
          </SecondaryButton>
          <DropdownMenu
            withinPortal
            position="bottom-start"
          >
            <DropdownMenu.Target>
              <SecondaryButton
                p={5}
                variant="subtle"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <RiMore2Fill
                  color="white"
                  size={20}
                />
              </SecondaryButton>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              {PLAY_TYPES.filter((type) => type.play !== playButtonBehavior).map((type) => (
                <DropdownMenu.Item
                  key={`playtype-${type.play}`}
                  onClick={(e) => handlePlay(e, type.play)}
                >
                  {type.label}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Item disabled>Add to playlist</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Refresh metadata</DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Group>
      </BottomControls>
    </GridCardControlsContainer>
  );
};

export default GridCardControls;
