import { useCallback, useRef } from 'react';

import { DlnaPlayerEngine, DlnaPlayerEngineHandle } from './engine/dlna-player-engine';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import {
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerVolume,
} from '/@/renderer/store';

export function DlnaPlayer() {
    const playerRef = useRef<DlnaPlayerEngineHandle>(null);
    const { status } = usePlayerData();
    const { mediaAutoNext } = usePlayerActions();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const player = usePlayer();

    const handleOnEnded = useCallback(() => {
        mediaAutoNext();
    }, [mediaAutoNext]);

    usePlayerEvents(
        {
            onQueueCleared: () => {
                player.mediaStop();
            },
        },
        [],
    );

    return (
        <DlnaPlayerEngine
            isMuted={isMuted}
            onEnded={handleOnEnded}
            playerRef={playerRef}
            playerStatus={status}
            volume={volume}
        />
    );
}
