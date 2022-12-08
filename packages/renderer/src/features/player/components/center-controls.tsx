import { useEffect, useState } from 'react';
import format from 'format-duration';
import isElectron from 'is-electron';
import { IoIosPause } from 'react-icons/io';
import {
  RiPlayFill,
  RiRepeat2Line,
  RiRepeatOneLine,
  RiRewindFill,
  RiShuffleFill,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiSpeedFill,
} from 'react-icons/ri';
import styled from 'styled-components';
import { Text } from '/@/components';
import { usePlayerStore } from '/@/store';
import { useSettingsStore } from '/@/store/settings.store';
import { PlaybackType, PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/types';
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
  const songDuration = usePlayerStore((state) => state.current.song?.duration);
  const skip = useSettingsStore((state) => state.player.skipButtons);
  const playerType = useSettingsStore((state) => state.player.type);
  const player1 = playersRef?.current?.player1;
  const player2 = playersRef?.current?.player2;
  const { status, player } = usePlayerStore((state) => state.current);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);

  const {
    handleNextTrack,
    handlePlayPause,
    handlePrevTrack,
    handleSeekSlider,
    handleSkipBackward,
    handleSkipForward,
    handleToggleRepeat,
    handleToggleShuffle,
  } = useCenterControls({ playersRef });

  const currentTime = usePlayerStore((state) => state.current.time);
  const currentPlayerRef = player === 1 ? player1 : player2;
  const duration = format((songDuration || 0) * 1000);
  const formattedTime = format(currentTime * 1000 || 0);

  useEffect(() => {
    let interval: any;

    if (status === PlayerStatus.PLAYING && !isSeeking) {
      if (!isElectron() || playerType === PlaybackType.WEB) {
        interval = setInterval(() => {
          setCurrentTime(currentPlayerRef.getCurrentTime());
        }, 1000);
      }
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [currentPlayerRef, isSeeking, setCurrentTime, playerType, status]);

  return (
    <>
      <ControlsContainer>
        <ButtonsContainer>
          <PlayerButton
            $isActive={shuffle !== PlayerShuffle.NONE}
            icon={<RiShuffleFill size={15} />}
            tooltip={{
              label:
                shuffle === PlayerShuffle.NONE
                  ? 'Shuffle disabled'
                  : shuffle === PlayerShuffle.TRACK
                  ? 'Shuffle tracks'
                  : 'Shuffle albums',
              openDelay: 500,
            }}
            variant="tertiary"
            onClick={handleToggleShuffle}
          />
          <PlayerButton
            icon={<RiSkipBackFill size={15} />}
            tooltip={{ label: 'Previous track', openDelay: 500 }}
            variant="secondary"
            onClick={handlePrevTrack}
          />
          {skip?.enabled && (
            <PlayerButton
              icon={<RiRewindFill size={15} />}
              tooltip={{
                label: `Skip backwards ${skip?.skipBackwardSeconds} seconds`,
                openDelay: 500,
              }}
              variant="secondary"
              onClick={() => handleSkipBackward(skip?.skipBackwardSeconds)}
            />
          )}
          <PlayerButton
            icon={
              status === PlayerStatus.PAUSED ? <RiPlayFill size={20} /> : <IoIosPause size={20} />
            }
            tooltip={{
              label: status === PlayerStatus.PAUSED ? 'Play' : 'Pause',
              openDelay: 500,
            }}
            variant="main"
            onClick={handlePlayPause}
          />
          {skip?.enabled && (
            <PlayerButton
              icon={<RiSpeedFill size={15} />}
              tooltip={{
                label: `Skip forwards ${skip?.skipForwardSeconds} seconds`,
                openDelay: 500,
              }}
              variant="secondary"
              onClick={() => handleSkipForward(skip?.skipForwardSeconds)}
            />
          )}
          <PlayerButton
            icon={<RiSkipForwardFill size={15} />}
            tooltip={{ label: 'Next track', openDelay: 500 }}
            variant="secondary"
            onClick={handleNextTrack}
          />
          <PlayerButton
            $isActive={repeat !== PlayerRepeat.NONE}
            icon={
              repeat === PlayerRepeat.ONE ? (
                <RiRepeatOneLine size={15} />
              ) : (
                <RiRepeat2Line size={15} />
              )
            }
            tooltip={{
              label: `${
                repeat === PlayerRepeat.NONE
                  ? 'Repeat disabled'
                  : repeat === PlayerRepeat.ALL
                  ? 'Repeat all'
                  : 'Repeat one'
              }`,
              openDelay: 500,
            }}
            variant="tertiary"
            onClick={handleToggleRepeat}
          />
        </ButtonsContainer>
      </ControlsContainer>
      <SliderContainer>
        <SliderValueWrapper position="left">
          <Text
            $noSelect
            $secondary
            size="xs"
            weight={600}
          >
            {formattedTime}
          </Text>
        </SliderValueWrapper>
        <SliderWrapper>
          <Slider
            height="100%"
            max={songDuration}
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
          <Text
            $noSelect
            $secondary
            size="xs"
            weight={600}
          >
            {duration}
          </Text>
        </SliderValueWrapper>
      </SliderContainer>
    </>
  );
};
