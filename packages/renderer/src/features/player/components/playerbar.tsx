import { useRef } from 'react';
import styled from 'styled-components';
import { useSettingsStore } from '/@/store/settings.store';
import { PlaybackType } from '/@/types';
import { AudioPlayer } from '/@/components';
import {
  useCurrentPlayer,
  useCurrentStatus,
  usePlayer1Data,
  usePlayer2Data,
  usePlayerControls,
  useVolume,
} from '/@/store';
import { CenterControls } from './center-controls';
import { LeftControls } from './left-controls';
import { RightControls } from './right-controls';

const PlayerbarContainer = styled.div`
  width: 100%;
  height: 100%;
  border-top: var(--playerbar-border-top);
`;

const PlayerbarControlsGrid = styled.div`
  display: flex;
  gap: 1rem;
  height: 100%;
`;

const RightGridItem = styled.div`
  align-self: center;
  width: calc(100% / 3);
  height: 100%;
  overflow: hidden;
`;

const LeftGridItem = styled.div`
  width: calc(100% / 3);
  height: 100%;
  overflow: hidden;
`;

const CenterGridItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  width: calc(100% / 3);
  height: 100%;
  overflow: hidden;
`;

export const Playerbar = () => {
  const playersRef = useRef<any>();
  const settings = useSettingsStore((state) => state.player);
  const volume = useVolume();
  const player1 = usePlayer1Data();
  const player2 = usePlayer2Data();
  const status = useCurrentStatus();
  const player = useCurrentPlayer();
  const { autoNext } = usePlayerControls();

  return (
    <PlayerbarContainer>
      <PlayerbarControlsGrid>
        <LeftGridItem>
          <LeftControls />
        </LeftGridItem>
        <CenterGridItem>
          <CenterControls playersRef={playersRef} />
        </CenterGridItem>
        <RightGridItem>
          <RightControls />
        </RightGridItem>
      </PlayerbarControlsGrid>
      {settings.type === PlaybackType.WEB && (
        <AudioPlayer
          ref={playersRef}
          autoNext={autoNext}
          crossfadeDuration={settings.crossfadeDuration}
          crossfadeStyle={settings.crossfadeStyle}
          currentPlayer={player}
          muted={settings.muted}
          playbackStyle={settings.style}
          player1={player1}
          player2={player2}
          status={status}
          style={settings.style}
          volume={(volume / 100) ** 2}
        />
      )}
    </PlayerbarContainer>
  );
};
