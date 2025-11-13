import { useMemo } from 'react';

import { usePlayerSong } from '/@/renderer/store';
import { QueueSong } from '/@/shared/types/domain-types';

export const useIsCurrentSong = (song: QueueSong) => {
    const currentSong = usePlayerSong();

    const isActive = useMemo(() => {
        return song._uniqueId === currentSong?._uniqueId;
    }, [song._uniqueId, currentSong?._uniqueId]);

    return { isActive };
};
