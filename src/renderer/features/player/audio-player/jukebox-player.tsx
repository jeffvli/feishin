import { useRef } from 'react';

import {
    JukeboxPlayerEngine,
    JukeboxPlayerEngineHandle,
} from '/@/renderer/features/player/audio-player/engine/jukebox-player-engine';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    useAuthStore,
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerVolume,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

export function JukeboxPlayer() {
    const playerRef = useRef<JukeboxPlayerEngineHandle>(null);
    const { currentSong, status } = usePlayerData();
    const { mediaAutoNext, setTimestamp } = usePlayerActions();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const player = usePlayer();

    const credential = useAuthStore((state) => state.currentServer?.credential ?? '');
    const serverUrl = useAuthStore((state) => state.currentServer?.url ?? '');

    const currentTrackId = currentSong?.id ?? null;

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: (properties) => {
                playerRef.current?.seekTo(properties.timestamp);
            },
            onPlayerStatus: (properties) => {
                if (properties.status === PlayerStatus.PAUSED) {
                    playerRef.current?.pause();
                } else if (properties.status === PlayerStatus.PLAYING) {
                    playerRef.current?.play();
                }
            },
            onPlayerVolume: (properties) => {
                playerRef.current?.setVolume(properties.volume);
            },
            onQueueCleared: () => {
                player.mediaStop();
            },
        },
        [volume],
    );

    return (
        <JukeboxPlayerEngine
            credential={credential}
            currentTrackId={currentTrackId}
            isMuted={isMuted}
            onEnded={mediaAutoNext}
            onTick={(positionSeconds) => {
                setTimestamp(Math.floor(positionSeconds));
            }}
            playerRef={playerRef}
            playerStatus={status}
            serverUrl={serverUrl}
            volume={volume}
        />
    );
}
