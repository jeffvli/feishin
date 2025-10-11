import { useCallback } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { ItemListKey } from '/@/shared/types/types';

interface ListRefreshButtonProps {
    listKey: ItemListKey;
}

export const ListRefreshButton = ({ listKey }: ListRefreshButtonProps) => {
    const handleRefresh = useCallback(() => {
        eventEmitter.emit('ITEM_LIST_REFRESH', { key: listKey });
    }, [listKey]);

    return <RefreshButton onClick={handleRefresh} />;
};
