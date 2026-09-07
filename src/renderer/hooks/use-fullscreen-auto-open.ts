import { useEffect, useRef } from 'react';

import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    useFullscreenAutoOpenTimeout,
    useFullScreenPlayerStore,
    usePlayerStatus,
    useSetFullScreenPlayerStore,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;

// mousemove/wheel can fire thousands of times a second; only re-arm the timeout at most
// once per this interval instead of on every single event.
const ACTIVITY_THROTTLE_MS = 1000;

/**
 * Opens the fullscreen player after the configured number of minutes pass with no
 * user activity while a song (local or radio) is playing. Any user activity resets the
 * timer, and the feature is disabled entirely when no timeout is configured.
 */
export const useFullscreenAutoOpen = () => {
    const timeoutMinutes = useFullscreenAutoOpenTimeout();
    const status = usePlayerStatus();
    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying } = useRadioPlayer();
    const { expanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();

    const isPlaying = status === PlayerStatus.PLAYING || (isRadioActive && isRadioPlaying);

    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastResetAtRef = useRef(0);

    useEffect(() => {
        if (!timeoutMinutes || !isPlaying || expanded) {
            return;
        }

        const timeoutMs = timeoutMinutes * 60 * 1000;

        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setFullScreenPlayerStore({ expanded: true });
            }, timeoutMs);
        };

        const onActivity = () => {
            const now = Date.now();
            if (now - lastResetAtRef.current < ACTIVITY_THROTTLE_MS) {
                return;
            }

            lastResetAtRef.current = now;
            resetTimer();
        };

        resetTimer();
        lastResetAtRef.current = Date.now();

        for (const event of ACTIVITY_EVENTS) {
            window.addEventListener(event, onActivity, { passive: true });
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }

            for (const event of ACTIVITY_EVENTS) {
                window.removeEventListener(event, onActivity);
            }
        };
    }, [timeoutMinutes, isPlaying, expanded, setFullScreenPlayerStore]);
};
