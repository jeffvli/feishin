import { MouseEvent, useCallback } from 'react';

import styles from './playerbar.module.css';

import { AudioPlayer } from '/@/renderer/components';
import { CenterControls } from '/@/renderer/features/player/components/center-controls';
import { LeftControls } from '/@/renderer/features/player/components/left-controls';
import { RightControls } from '/@/renderer/features/player/components/right-controls';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import {
    useCurrentPlayer,
    useCurrentStatus,
    useFullScreenPlayerStore,
    useMuted,
    usePlayer1Data,
    usePlayer2Data,
    usePlayerControls,
    useSetFullScreenPlayerStore,
    useVolume,
} from '/@/renderer/store';
import {
    useGeneralSettings,
    usePlaybackType,
    useSettingsStore,
} from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/shared/types/types';

export const Playerbar = () => {
    const playersRef = PlayersRef;
    const settings = useSettingsStore((state) => state.playback);
    const { playerbarOpenDrawer } = useGeneralSettings();
    const playbackType = usePlaybackType();
    const volume = useVolume();
    const player1 = usePlayer1Data();
    const player2 = usePlayer2Data();
    const status = useCurrentStatus();
    const player = useCurrentPlayer();
    const muted = useMuted();
    const { autoNext } = usePlayerControls();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();

    const handleToggleFullScreenPlayer = (e?: KeyboardEvent | MouseEvent<HTMLDivElement>) => {
        e?.stopPropagation();
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const autoNextFn = useCallback(() => {
        const playerData = autoNext();
        updateSong(playerData.current.song);
    }, [autoNext]);

    return (
        <div
            className={styles.container}
            onClick={playerbarOpenDrawer ? handleToggleFullScreenPlayer : undefined}
        >
            <div className={styles.controlsGrid}>
                <div className={styles.leftGridItem}>
                    <LeftControls />
                </div>
                <div className={styles.centerGridItem}>
                    <CenterControls playersRef={playersRef} />
                </div>
                <div className={styles.rightGridItem}>
                    <RightControls />
                </div>
            </div>
            {playbackType === PlaybackType.WEB && (
                <AudioPlayer
                    autoNext={autoNextFn}
                    crossfadeDuration={settings.crossfadeDuration}
                    crossfadeStyle={settings.crossfadeStyle}
                    currentPlayer={player}
                    muted={muted}
                    playbackStyle={settings.style}
                    player1={player1}
                    player2={player2}
                    ref={playersRef}
                    status={status}
                    style={settings.style as any}
                    volume={(volume / 100) ** 2}
                />
            )}
        </div>
    );
};
