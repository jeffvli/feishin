import { useEffect, useRef } from 'react';

import {
    useMpvInitialized,
    usePlayerHydrated,
    usePlayerStatus,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

// The player status is not persisted, so remember separately whether music was playing at close.
const WAS_PLAYING_KEY = 'player_was_playing';

// Resume playback on start if music was playing when the app was closed. Playing through
// mediaPlay also runs the startup seek to the restored position (see use-queue-restore).
export const ResumeOnStartHook = () => {
    const hydrated = usePlayerHydrated();
    const mpvInitialized = useMpvInitialized();
    const status = usePlayerStatus();
    const playerType = useSettingsStore((state) => state.playback.type);
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current || !hydrated) {
            return;
        }

        // mpv has to have the restored queue loaded before it can play
        if (playerType === PlayerType.LOCAL && !mpvInitialized) {
            return;
        }

        handledRef.current = true;
        const wasPlaying = localStorage.getItem(WAS_PLAYING_KEY) === 'true';
        localStorage.setItem(WAS_PLAYING_KEY, 'false');

        const { general, playback } = useSettingsStore.getState();
        const isLocalPlayer = playerType === PlayerType.LOCAL || playerType === PlayerType.WEB;
        const { getCurrentSong, mediaPlay } = usePlayerStore.getState();

        if (
            wasPlaying &&
            playback.resumeAfterStart &&
            general.resume &&
            isLocalPlayer &&
            getCurrentSong()
        ) {
            mediaPlay();
        }
    }, [hydrated, mpvInitialized, playerType]);

    useEffect(() => {
        // Before startup is handled, the status is the default and would overwrite the flag
        if (!handledRef.current) {
            return;
        }

        localStorage.setItem(WAS_PLAYING_KEY, String(status === PlayerStatus.PLAYING));
    }, [status]);

    return null;
};
