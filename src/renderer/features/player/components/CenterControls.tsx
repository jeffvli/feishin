import { useEffect, useMemo, useState } from 'react';
import format from 'format-duration';
import { useTranslation } from 'react-i18next';
import {
  RiPauseLine,
  RiPlayFill,
  RiRewindFill,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiSpeedFill,
} from 'react-icons/ri';
import styled from 'styled-components';
import { PlaybackType, PlayerStatus } from '../../../../types';
import { Text } from '../../../components';
import { usePlayerStore } from '../../../store';
import { Font } from '../../../styles';
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

    if (status === PlayerStatus.PLAYING && !isSeeking) {
      if (settings.type === PlaybackType.WEB) {
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
            icon={<RiSkipBackFill size={15} />}
            tooltip={{ label: `${t('player.prev')}` }}
            variant="secondary"
            onClick={handlePrevTrack}
          />
          <PlayerButton
            icon={<RiRewindFill size={15} />}
            tooltip={{ label: `${t('player.skipBack')}` }}
            variant="secondary"
            onClick={handleSkipBackward}
          />
          <PlayerButton
            icon={
              status === PlayerStatus.PAUSED ? (
                <RiPlayFill size={20} />
              ) : (
                <RiPauseLine size={20} stroke="20px" />
              )
            }
            tooltip={{
              label:
                status === PlayerStatus.PAUSED
                  ? `${t('player.play')}`
                  : `${t('player.pause')}`,
            }}
            variant="main"
            onClick={handlePlayPause}
          />
          <PlayerButton
            icon={<RiSpeedFill size={15} />}
            tooltip={{ label: `${t('player.skipForward')}` }}
            variant="secondary"
            onClick={handleSkipForward}
          />
          <PlayerButton
            icon={<RiSkipForwardFill size={15} />}
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
