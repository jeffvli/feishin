import { useState } from 'react';
import styled from 'styled-components';
import { Playerbar } from '/@/renderer/features/player';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

interface PlayerbarContainerProps {
    barState: string;
}

const PlayerbarContainer = styled.footer<PlayerbarContainerProps>`
    z-index: 200;
    grid-area: player;
    background: var(--${(props) => props.barState});
    transition: background 0.2s;
`;

export const PlayerBar = () => {
    const { playerbarOpenDrawer } = useGeneralSettings();
    const [barState, setBarState] = useState('playerbar-bg');

    const handleMouseEnter = () => {
        setBarState('playerbar-bg-active');
    };

    const handleMouseLeave = () => {
        setBarState('playerbar-bg');
    };

    return (
        <PlayerbarContainer
            barState={barState}
            id="player-bar"
            onMouseLeave={playerbarOpenDrawer ? handleMouseLeave : undefined}
            onMouseOver={playerbarOpenDrawer ? handleMouseEnter : undefined}
        >
            <Playerbar />
        </PlayerbarContainer>
    );
};
