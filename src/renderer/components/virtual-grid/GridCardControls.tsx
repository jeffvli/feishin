import React from 'react';
import { Button, UnstyledButton, UnstyledButtonProps } from '@mantine/core';
import { motion } from 'framer-motion';
import { RiPlayFill } from 'react-icons/ri';
import styled from 'styled-components';
import { Play } from '../../../types';

type PlayButtonType = UnstyledButtonProps &
  React.ComponentPropsWithoutRef<'button'>;

const PlayButton = styled(UnstyledButton)<PlayButtonType>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border: 1px solid var(--primary-color);
  border-radius: 50%;
  cursor: default;
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 1;
  }

  svg {
    fill: #000;
    stroke: #000;
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

const ControlsRow = styled(motion.div)`
  width: 100%;
  height: calc(100% / 3);
`;

const TopControls = styled(ControlsRow)`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const CenterControls = styled(ControlsRow)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BottomControls = styled(ControlsRow)`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
`;

export const GridCardControls = ({
  itemData,
  handlePlayQueueAdd,
  cardControls,
}: any) => {
  return (
    <GridCardControlsContainer>
      <TopControls />
      <CenterControls animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
        <PlayButton
          onClick={() => {
            handlePlayQueueAdd({
              byItemType: {
                endpoint: cardControls.endpoint,
                id: itemData[cardControls.idProperty],
                type: cardControls.type,
              },
              play: Play.NOW,
            });
          }}
        >
          <RiPlayFill size={25} />
        </PlayButton>
      </CenterControls>
      <BottomControls>
        <Button
          onClick={() => {
            handlePlayQueueAdd({
              byItemType: {
                endpoint: cardControls.endpoint,
                id: itemData[cardControls.idProperty],
                type: cardControls.type,
              },
              play: Play.NEXT,
            });
          }}
        >
          NEXT
        </Button>
        <Button
          onClick={() => {
            handlePlayQueueAdd({
              byItemType: {
                endpoint: cardControls.endpoint,
                id: itemData[cardControls.idProperty],
                type: cardControls.type,
              },
              play: Play.LAST,
            });
          }}
        >
          LATER
        </Button>
      </BottomControls>
    </GridCardControlsContainer>
  );
};
