import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import format from 'format-duration';
import isElectron from 'is-electron';
import { IoIosPause } from 'react-icons/io';
import {
  RiPlayFill,
  RiRepeat2Fill,
  RiShuffleFill,
  RiSkipBackFill,
  RiSkipForwardFill,
} from 'react-icons/ri';
import { Text } from '@/renderer/components';
import { usePlayerStore } from '@/renderer/store';
import { Font } from '@/renderer/styles';
import { PlaybackType, PlayerStatus } from '@/renderer/types';
import { useCenterControls } from '../hooks/use-center-controls';
import { PlayerButton } from './player-button';
import { Slider } from './slider';

interface CenterControlsProps {
  playersRef: any;
}

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 35px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SliderContainer = styled.div`
  display: flex;
  height: 20px;
`;

const SliderValueWrapper = styled.div<{ position: 'left' | 'right' }>`
  flex: 1;
  align-self: center;
  max-width: 50px;
  text-align: center;
`;

const SliderWrapper = styled.div`
  display: flex;
  flex: 6;
  height: 100%;
`;

export const CenterControls = ({ playersRef }: CenterControlsProps) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const playerData = usePlayerStore((state) => state.getPlayerData());
  const player1 = playersRef?.current?.player1?.player;
  const player2 = playersRef?.current?.player2?.player;
  const { status, player } = usePlayerStore((state) => state.current);
  const settings = usePlayerStore((state) => state.settings);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);

  const {
    handleNextTrack,
    handlePlayPause,
    handlePrevTrack,
    handleSeekSlider,
  } = useCenterControls({ playersRef });

  const currentTime = usePlayerStore((state) => state.current.time);
  const currentPlayerRef = player === 1 ? player1 : player2;
  const duration = format((playerData.queue.current?.duration || 0) * 1000);
  const formattedTime = format(currentTime * 1000 || 0);

  useEffect(() => {
    let interval: any;

    if (status === PlayerStatus.PLAYING && !isSeeking) {
      if (!isElectron() || settings.type === PlaybackType.WEB) {
        interval = setInterval(() => {
          setCurrentTime(currentPlayerRef.getCurrentTime());
        }, 1000);
      }
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [currentPlayerRef, isSeeking, setCurrentTime, settings.type, status]);

  return (
    <>
      <ControlsContainer>
        <ButtonsContainer>
          <PlayerButton
            icon={<RiShuffleFill size={15} />}
            tooltip={{ label: `Shuffle`, openDelay: 500 }}
            variant="secondary"
            onClick={handlePrevTrack}
          />
          <PlayerButton
            icon={<RiSkipBackFill size={15} />}
            tooltip={{ label: `Previous track`, openDelay: 500 }}
            variant="secondary"
            onClick={handlePrevTrack}
          />
          <PlayerButton
            icon={
              status === PlayerStatus.PAUSED ? (
                <RiPlayFill size={20} />
              ) : (
                <IoIosPause size={20} />
              )
            }
            tooltip={{
              label: status === PlayerStatus.PAUSED ? 'Play' : 'Pause',
              openDelay: 500,
            }}
            variant="main"
            onClick={handlePlayPause}
          />
          <PlayerButton
            icon={<RiSkipForwardFill size={15} />}
            tooltip={{ label: 'Next track', openDelay: 500 }}
            variant="secondary"
            onClick={handleNextTrack}
          />
          <PlayerButton
            icon={<RiRepeat2Fill size={15} />}
            tooltip={{ label: 'Repeat', openDelay: 500 }}
            variant="secondary"
            onClick={handleNextTrack}
          />
        </ButtonsContainer>
      </ControlsContainer>
      <SliderContainer>
        <SliderValueWrapper position="left">
          <Text noSelect secondary font={Font.POPPINS} size="xs" weight={600}>
            {formattedTime}
          </Text>
        </SliderValueWrapper>
        <SliderWrapper>
          <Slider
            height="100%"
            max={playerData.queue.current?.duration}
            min={0}
            tooltipType="time"
            value={currentTime}
            onAfterChange={(e) => {
              handleSeekSlider(e);
              setIsSeeking(false);
            }}
          />
        </SliderWrapper>
        <SliderValueWrapper position="right">
          <Text noSelect secondary font={Font.POPPINS} size="xs" weight={600}>
            {duration}
          </Text>
        </SliderValueWrapper>
      </SliderContainer>
    </>
  );
};
