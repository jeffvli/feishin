import { useEffect } from 'react';

import { useFullScreenPlayerStore } from '/@/renderer/store/full-screen-player.store';

/**
 * Id applied to the expanded visualizer's inner container so that F11 can target it
 * directly. Fullscreening that element (rather than the whole document) promotes it to
 * the browser's top layer, so it covers the window bar and playerbar instead of being
 * boxed in by them.
 */
export const VISUALIZER_FULLSCREEN_TARGET_ID = 'visualizer-fullscreen-target';

/** Same F11-targeting trick as `VISUALIZER_FULLSCREEN_TARGET_ID`, for the music video panel. */
export const VIDEO_FULLSCREEN_TARGET_ID = 'video-fullscreen-target';

export const useFullscreenToggle = () => {
    useEffect(() => {
        const toggleFullscreen = () => {
            // Already fullscreen: back out, regardless of what was fullscreened.
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
                return;
            }

            const { videoExpanded, visualizerExpanded } = useFullScreenPlayerStore.getState();

            const visualizerTarget = visualizerExpanded
                ? document.getElementById(VISUALIZER_FULLSCREEN_TARGET_ID)
                : null;
            const videoTarget = videoExpanded
                ? document.getElementById(VIDEO_FULLSCREEN_TARGET_ID)
                : null;

            // Expanded visualizer/video -> fullscreen just that container.
            // Anything else -> normal whole-window fullscreen.
            const target = visualizerTarget ?? videoTarget ?? document.documentElement;

            target.requestFullscreen().catch(() => {});
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'F11') return;

            event.preventDefault();
            toggleFullscreen();
        };

        // Capture phase so this still fires while a text input has focus.
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);
};
