import styled from 'styled-components';
import { Playerbar } from '/@/renderer/features/player';

const PlayerbarContainer = styled.footer`
  z-index: 200;
  grid-area: player;
  background: var(--playerbar-bg);
`;

export const PlayerBar = () => {
  return (
    <PlayerbarContainer id="player-bar">
      <Playerbar />
    </PlayerbarContainer>
  );
};
