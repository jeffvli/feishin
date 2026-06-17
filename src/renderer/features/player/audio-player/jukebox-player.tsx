import { useCallback, useRef } from 'react';

import {
    JukeboxPlayerEngine,
    JukeboxPlayerEngineHandle,
    JukeboxServerState,
} from '/@/renderer/features/player/audio-player/engine/jukebox-player-engine';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    useCurrentServerId,
    usePlayerActions,
    usePlayerData,
    usePlayerHydrated,
    usePlayerMuted,
    usePlayerStore,
    usePlayerVolume,
} from '/@/renderer/store';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';

export function JukeboxPlayer() {
    const playerRef = useRef<JukeboxPlayerEngineHandle>(null);
    const { currentSong, nextSong, status } = usePlayerData();
    const { mediaAutoNext, mediaPause, mediaPlay, mediaPlayByIndex, setTimestamp, setVolume } =
        usePlayerActions();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const player = usePlayer();
    const playerHydrated = usePlayerHydrated();

    const serverId = useCurrentServerId();

    const currentTrackId = currentSong?.id ?? null;
    const nextTrackId = nextSong?.id ?? null;

    const handleServerStateSynced = useCallback(
        (state: JukeboxServerState) => {
            const { gain, playing, position, trackId } = state;

            if (trackId) {
                const queue = usePlayerStore.getState().getQueue();
                const queueIndex = queue.items.findIndex((item) => item.id === trackId);

                if (queueIndex !== -1) {
                    const currentId = usePlayerStore.getState().getCurrentSong()?.id;
                    if (trackId !== currentId) {
                        mediaPlayByIndex(queueIndex);
                    }
                }
            }

            if (position > 0) {
                setTimestamp(Math.floor(position));
            }

            if (playing) {
                mediaPlay();
            } else {
                mediaPause();
            }

            const volumeFromGain = Math.round(gain * 100);
            if (volumeFromGain !== volume) {
                setVolume(volumeFromGain);
            }
        },
        [mediaPause, mediaPlay, mediaPlayByIndex, setTimestamp, setVolume, volume],
    );

    const debouncedSeekToTimestamp = useDebouncedCallback((timestamp: number) => {
        playerRef.current?.seekTo(timestamp);
    }, 300);

    const debouncedSetVolume = useDebouncedCallback((nextVolume: number) => {
        playerRef.current?.setVolume(nextVolume);
    }, 300);

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: (properties) => {
                debouncedSeekToTimestamp(properties.timestamp);
            },
            onPlayerVolume: (properties) => {
                debouncedSetVolume(properties.volume);
            },
            onQueueCleared: () => {
                player.mediaStop();
            },
        },
        [debouncedSeekToTimestamp, debouncedSetVolume, player],
    );

    return (
        <JukeboxPlayerEngine
            currentTrackId={currentTrackId}
            enabled={playerHydrated && Boolean(serverId)}
            isMuted={isMuted}
            nextTrackId={nextTrackId}
            onEnded={mediaAutoNext}
            onServerStateSynced={handleServerStateSynced}
            onTick={(positionSeconds) => {
                setTimestamp(Math.floor(positionSeconds));
            }}
            playerRef={playerRef}
            playerStatus={status}
            serverId={serverId}
            volume={volume}
        />
    );
}
