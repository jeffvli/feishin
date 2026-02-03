import { useIsMutating } from '@tanstack/react-query';
import { useCallback } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { ItemListKey } from '/@/shared/types/types';

interface ListRefreshButtonProps {
    disabled?: boolean;
    listKey: ItemListKey;
}

export const ListRefreshButton = ({ disabled, listKey }: ListRefreshButtonProps) => {
    const isRefreshing = useIsMutating({ mutationKey: getListRefreshMutationKey(listKey) }) > 0;

    const handleRefresh = useCallback(() => {
        eventEmitter.emit('ITEM_LIST_REFRESH', { key: listKey });
    }, [listKey]);

    return <RefreshButton disabled={disabled} loading={isRefreshing} onClick={handleRefresh} />;
};

export const LIST_REFRESH_MUTATION_KEY = 'item-list-refresh';

export const getListRefreshMutationKey = (listKey: string) =>
    [LIST_REFRESH_MUTATION_KEY, listKey] as const;
