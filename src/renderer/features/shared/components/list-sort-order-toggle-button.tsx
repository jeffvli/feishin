import { OrderToggleButton } from '/@/renderer/features/shared/components/order-toggle-button';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ListSortOrderToggleButtonProps {
    listKey: ItemListKey;
}

export const ListSortOrderToggleButton = ({ listKey }: ListSortOrderToggleButtonProps) => {
    const server = useCurrentServer();

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: SortOrder.ASC,
        key: getPersistenceKey(server.id, listKey),
    });

    const { sortOrder, setSortOrder } = useSortOrderFilter(persisted || SortOrder.ASC);

    const handleToggleSortOrder = () => {
        const newSortOrder = sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        setSortOrder(newSortOrder);
        setPersisted(newSortOrder);
    };

    return (
        <OrderToggleButton onToggle={handleToggleSortOrder} sortOrder={sortOrder as SortOrder} />
    );
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey) => {
    return `${serverId}-list-${listKey}-${FILTER_KEYS.SHARED.SORT_ORDER}`;
};
