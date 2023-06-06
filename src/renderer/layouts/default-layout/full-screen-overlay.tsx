import { AnimatePresence } from 'framer-motion';
import { FullScreenPlayer } from '/@/renderer/features/player/components/full-screen-player';
import { useFullScreenPlayerStore } from '/@/renderer/store';

export const FullScreenOverlay = () => {
  const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();

  return (
    <>
      <AnimatePresence initial={false}>
        {isFullScreenPlayerExpanded && <FullScreenPlayer />}
      </AnimatePresence>
    </>
  );
};
