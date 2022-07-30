import { RiVolumeUpFill, RiVolumeMuteFill } from 'react-icons/ri';
import styled from 'styled-components';
import { IconButton } from 'renderer/components';
import { usePlayerStore } from 'renderer/store';
import { useRightControls } from '../hooks/useRightControls';
import { Slider } from './Slider';

const RightControlsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
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
  width: 100%;
  overflow: visible;
`;

export const RightControls = () => {
  const volume = usePlayerStore((state) => state.settings.volume);
  const muted = usePlayerStore((state) => state.settings.muted);
  const { handleVolumeSlider, handleVolumeSliderState, handleMute } =
    useRightControls();

  return (
    <RightControlsContainer>
      <MetadataStack>
        <VolumeSliderWrapper>
          <IconButton
            icon={
              muted ? (
                <RiVolumeMuteFill size={20} />
              ) : (
                <RiVolumeUpFill size={20} />
              )
            }
            size={20}
            tooltip={{ label: muted ? 'Muted' : volume }}
            variant="transparent"
            onClick={handleMute}
          />

          <Slider
            hasTooltip
            height="100%"
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
