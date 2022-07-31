import { useRef } from 'react';
import styled from 'styled-components';
import { PlaybackType } from '../../../../types';
import { AudioPlayer } from '../../../components';
import { usePlayerStore } from '../../../store';
import { CenterControls } from './CenterControls';
import { LeftControls } from './LeftControls';
import { RightControls } from './RightControls';

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
  const settings = usePlayerStore((state) => state.settings);
  const volume = usePlayerStore((state) => state.settings.volume);
  const player1 = usePlayerStore((state) => state.player1());
  const player2 = usePlayerStore((state) => state.player2());
  const status = usePlayerStore((state) => state.current.status);
  const player = usePlayerStore((state) => state.current.player);
  const autoNext = usePlayerStore((state) => state.autoNext);

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
      {settings.type === PlaybackType.Web && (
        <AudioPlayer
          ref={playersRef}
          autoNext={autoNext}
          crossfadeDuration={settings.crossfadeDuration}
          crossfadeStyle={settings.crossfadeStyle}
          currentPlayer={player}
          muted={settings.muted}
          player1={player1}
          player2={player2}
          status={status}
          style={settings.style}
          volume={volume}
        />
      )}
    </PlayerbarContainer>
  );
};
