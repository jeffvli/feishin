import { createContext } from 'react';
import { PlayQueueAddOptions } from '/@/renderer/types';

export const PlayQueueHandlerContext = createContext<{
    handlePlayQueueAdd: ((options: PlayQueueAddOptions) => void) | undefined;
}>({
    handlePlayQueueAdd: undefined,
});
