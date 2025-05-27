import { AnimatePresence } from 'motion/react';

import { FullScreenPlayer } from '/@/renderer/features/player/components/full-screen-player';
import { useFullScreenPlayerStore } from '/@/renderer/store';

export const FullScreenOverlay = () => {
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();

    return (
        <AnimatePresence initial={false}>
            {isFullScreenPlayerExpanded && <FullScreenPlayer />}
        </AnimatePresence>
    );
};
