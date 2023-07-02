import { useContext } from 'react';
import { PlayQueueHandlerContext } from '/@/renderer/features/player/context/play-queue-handler-context';

export const usePlayQueueAdd = () => {
    const { handlePlayQueueAdd } = useContext(PlayQueueHandlerContext);
    return handlePlayQueueAdd;
};
