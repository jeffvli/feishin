import { useEffect, useState } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';

export const useListRefreshTick = (listKey: string): number => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const handleRefresh = (payload: { key: string }) => {
            if (payload.key === listKey) {
                setTick((t) => t + 1);
            }
        };

        eventEmitter.on('ITEM_LIST_REFRESH', handleRefresh);

        return () => {
            eventEmitter.off('ITEM_LIST_REFRESH', handleRefresh);
        };
    }, [listKey]);

    return tick;
};
