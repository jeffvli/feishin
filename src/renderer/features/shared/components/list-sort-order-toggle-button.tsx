import { useLocalStorage } from '@mantine/hooks';
import { parseAsString, useQueryState } from 'nuqs';

import { OrderToggleButton } from '/@/renderer/features/shared/components/order-toggle-button';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ListSortOrderToggleButtonProps {
    listKey: ItemListKey;
}

export const ListSortOrderToggleButton = ({ listKey }: ListSortOrderToggleButtonProps) => {
    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: SortOrder.ASC,
        key: getPersistenceKey(listKey),
    });

    const [sortOrder, setSortOrder] = useQueryState(
        FILTER_KEYS.SORT_ORDER,
        parseAsString.withDefault(persisted || SortOrder.ASC),
    );

    const handleToggleSortOrder = () => {
        const newSortOrder = sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        setSortOrder(newSortOrder);
        setPersisted(newSortOrder);
    };

    return (
        <OrderToggleButton onToggle={handleToggleSortOrder} sortOrder={sortOrder as SortOrder} />
    );
};

const getPersistenceKey = (listKey: ItemListKey) => {
    return `item_list_${listKey}-${FILTER_KEYS.SORT_ORDER}`;
};
