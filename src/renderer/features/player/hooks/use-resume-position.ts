import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayerActions, usePlayerStore } from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

// Seeks to the server-stored resume position when a track starts playing.
// Only Jellyfin AudioBook items support resuming. The seek is delayed, as in
// use-queue-restore, so the engine has loaded the new track first.
export const useResumePosition = () => {
    const { mediaSeekToTimestamp } = usePlayerActions();

    usePlayerEvents(
        {
            onCurrentSongChange: (properties) => {
                const song = properties.song;
                const resumeSec = (song?.resumePositionMs ?? 0) / 1000;

                if (resumeSec <= 0) {
                    return;
                }

                setTimeout(() => {
                    const state = usePlayerStore.getState();

                    if (
                        state.getCurrentSong()?._uniqueId !== song?._uniqueId ||
                        state.player.status !== PlayerStatus.PLAYING
                    ) {
                        return;
                    }

                    mediaSeekToTimestamp(resumeSec);
                }, 100);
            },
        },
        [mediaSeekToTimestamp],
    );
};

export const ResumePositionHook = () => {
    useResumePosition();
    return null;
};
