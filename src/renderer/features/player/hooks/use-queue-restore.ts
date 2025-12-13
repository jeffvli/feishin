import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { setTimestamp, usePlayerStore } from '/@/renderer/store';

export const useQueueRestore = () => {
    const player = usePlayerStore();

    usePlayerEvents(
        {
            onQueueRestored: (properties) => {
                const { position } = properties;

                setTimeout(() => {
                    setTimestamp(position);
                    player.mediaSeekToTimestamp(position);
                }, 100);
            },
        },
        [],
    );
};
