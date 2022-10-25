import styled from '@emotion/styled';
import { RiVolumeUpFill, RiVolumeMuteFill } from 'react-icons/ri';
import { usePlayerStore } from '../../../store';
import { useRightControls } from '../hooks/use-right-controls';
import { PlayerButton } from './player-button';
import { Slider } from './slider';

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
          <PlayerButton
            icon={
              muted ? (
                <RiVolumeMuteFill size={15} />
              ) : (
                <RiVolumeUpFill size={15} />
              )
            }
            tooltip={{ label: muted ? 'Muted' : volume }}
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
