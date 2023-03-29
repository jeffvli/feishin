import styled from 'styled-components';
import { Playerbar } from '/@/renderer/features/player';

const PlayerbarContainer = styled.footer`
  z-index: 100;
  grid-area: player;
  background: var(--playerbar-bg);
  filter: drop-shadow(0 -3px 1px rgba(0, 0, 0, 10%));
`;

export const PlayerBar = () => {
  return (
    <PlayerbarContainer id="player-bar">
      <Playerbar />
    </PlayerbarContainer>
  );
};
