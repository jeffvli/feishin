import { Group } from '@mantine/core';
import { HiOutlineQueueList } from 'react-icons/hi2';
import {
  RiVolumeUpFill,
  RiVolumeDownFill,
  RiVolumeMuteFill,
} from 'react-icons/ri';
import styled from 'styled-components';
import { usePlayerStore, useAppStore } from '@/renderer/store';
import { useRightControls } from '../hooks/use-right-controls';
import { PlayerButton } from './player-button';
import { Slider } from './slider';

const RightControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  padding-right: 1rem;
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
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const isQueueExpanded = useAppStore((state) => state.sidebar.rightExpanded);
  const { handleVolumeSlider, handleVolumeSliderState, handleMute } =
    useRightControls();

  return (
    <RightControlsContainer>
      <Group>
        <PlayerButton
          icon={<HiOutlineQueueList />}
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
                <RiVolumeMuteFill size={15} />
              ) : volume > 50 ? (
                <RiVolumeUpFill size={15} />
              ) : (
                <RiVolumeDownFill size={15} />
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
  );
};
