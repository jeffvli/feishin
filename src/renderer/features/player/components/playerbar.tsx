import { useCallback } from 'react';
import isElectron from 'is-electron';
import styled from 'styled-components';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/renderer/types';
import { AudioPlayer } from '/@/renderer/components';
import {
    useCurrentPlayer,
    useCurrentStatus,
    useMuted,
    usePlayer1Data,
    usePlayer2Data,
    usePlayerControls,
    useVolume,
} from '/@/renderer/store';
import { CenterControls } from './center-controls';
import { LeftControls } from './left-controls';
import { RightControls } from './right-controls';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';

const PlayerbarContainer = styled.div`
    width: 100vw;
    height: 100%;
    border-top: var(--playerbar-border-top);
`;

const PlayerbarControlsGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
    height: 100%;

    @media (max-width: 768px) {
        grid-template-columns: minmax(0, 0.5fr) minmax(0, 1fr) minmax(0, 0.5fr);
    }
`;

const RightGridItem = styled.div`
    align-self: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const LeftGridItem = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const CenterGridItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const utils = isElectron() ? window.electron.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.electron.mpris : null;

export const Playerbar = () => {
    const playersRef = PlayersRef;
    const settings = useSettingsStore((state) => state.playback);
    const volume = useVolume();
    const player1 = usePlayer1Data();
    const player2 = usePlayer2Data();
    const status = useCurrentStatus();
    const player = useCurrentPlayer();
    const muted = useMuted();
    const { autoNext } = usePlayerControls();

    const autoNextFn = useCallback(() => {
        const playerData = autoNext();
        mpris?.updateSong({
            currentTime: 0,
            song: playerData.current.song,
        });
    }, [autoNext]);

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
                    autoNext={autoNextFn}
                    crossfadeDuration={settings.crossfadeDuration}
                    crossfadeStyle={settings.crossfadeStyle}
                    currentPlayer={player}
                    muted={muted}
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
