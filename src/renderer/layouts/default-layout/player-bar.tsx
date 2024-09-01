import styled from 'styled-components';
import { Playerbar } from '/@/renderer/features/player';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

interface PlayerbarContainerProps {
    drawerEffect: boolean;
}

const PlayerbarContainer = styled.footer<PlayerbarContainerProps>`
    z-index: 200;
    grid-area: player;
    background: var(--playerbar-bg);
    transition: background 0.5s;

    ${(props) =>
        props.drawerEffect &&
        `
        &:hover {
            background: var(--playerbar-bg-active);
        }
    `}
`;

export const PlayerBar = () => {
    const { playerbarOpenDrawer } = useGeneralSettings();

    return (
        <PlayerbarContainer
            drawerEffect={playerbarOpenDrawer}
            id="player-bar"
        >
            <Playerbar />
        </PlayerbarContainer>
    );
};
