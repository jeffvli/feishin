import { useEffect } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { PlayerPlayEventPayload } from '/@/renderer/events/events';
import { useAppStoreActions, useSettingsStore } from '/@/renderer/store';

/**
 * Spotify-style: open the Now Playing sidebar when the user starts playback
 * with Play Now / Shuffle (not on pause/resume or automatic next track).
 */
export const useNowPlayingAutoOpen = () => {
    const { setSideBar } = useAppStoreActions();

    useEffect(() => {
        const handlePlayerPlay = (payload: PlayerPlayEventPayload) => {
            if (!payload.openNowPlaying) return;
            if (useSettingsStore.getState().general.sideQueueType !== 'sideQueue') return;

            setSideBar({ nowPlaying: true, rightExpanded: true });
        };

        eventEmitter.on('PLAYER_PLAY', handlePlayerPlay);
        return () => {
            eventEmitter.off('PLAYER_PLAY', handlePlayerPlay);
        };
    }, [setSideBar]);
};
