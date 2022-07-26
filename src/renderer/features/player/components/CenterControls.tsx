import { useEffect, useMemo, useState } from 'react';
import format from 'format-duration';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
  PlayerPause,
  PlayerPlay,
  PlayerSkipBack,
  PlayerSkipForward,
  PlayerTrackNext,
  PlayerTrackPrev,
} from 'tabler-icons-react';
import { Text } from 'renderer/components';
import { usePlayerStore } from 'renderer/store';
import { Font } from 'renderer/styles';
import { PlaybackType, PlayerStatus } from 'types';
import { useCenterControls } from '../hooks/useCenterControls';
import { PlayerButton } from './PlayerButton';
import { Slider } from './Slider';

interface CenterControlsProps {
  playersRef: any;
}

const ControlsContainer = styled.div`
  display: flex;
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
  const { t } = useTranslation();
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
    handleSkipBackward,
    handleSkipForward,
  } = useCenterControls({ playersRef });

  const currentTime = usePlayerStore((state) => state.current.time);

  const currentPlayerRef = player === 1 ? player1 : player2;

  const duration = useMemo(
    () => format((playerData.queue.current?.duration || 0) * 1000),
    [playerData.queue]
  );

  const formattedTime = useMemo(
    () => format(currentTime * 1000 || 0),
    [currentTime]
  );

  useEffect(() => {
    let interval: any;

    if (status === PlayerStatus.Playing && !isSeeking) {
      if (settings.type === PlaybackType.Web) {
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
      <ControlsContainer onScroll={(e) => console.log(e)}>
        <ButtonsContainer>
          <PlayerButton
            icon={<PlayerSkipBack size={15} />}
            tooltip={{ label: `${t('player.prev')}` }}
            variant="secondary"
            onClick={handlePrevTrack}
          />
          <PlayerButton
            icon={<PlayerTrackPrev size={15} />}
            tooltip={{ label: `${t('player.skipBack')}` }}
            variant="secondary"
            onClick={handleSkipBackward}
          />
          <PlayerButton
            icon={
              status === PlayerStatus.Paused ? (
                <PlayerPlay size={20} />
              ) : (
                <PlayerPause size={20} />
              )
            }
            tooltip={{
              label:
                status === PlayerStatus.Paused
                  ? `${t('player.play')}`
                  : `${t('player.pause')}`,
            }}
            variant="main"
            onClick={handlePlayPause}
          />
          <PlayerButton
            icon={<PlayerTrackNext size={15} />}
            tooltip={{ label: `${t('player.skipForward')}` }}
            variant="secondary"
            onClick={handleSkipForward}
          />
          <PlayerButton
            icon={<PlayerSkipForward size={15} />}
            tooltip={{ label: `${t('player.next')}` }}
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
