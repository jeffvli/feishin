import { OrderToggleButton } from '/@/renderer/features/shared/components/order-toggle-button';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ListSortOrderToggleButtonProps {
    defaultSortOrder: SortOrder;
    listKey: ItemListKey;
}

export const ListSortOrderToggleButton = ({
    defaultSortOrder,
    listKey,
}: ListSortOrderToggleButtonProps) => {
    const { setSortOrder, sortOrder } = useSortOrderFilter(defaultSortOrder, listKey);

    const handleToggleSortOrder = () => {
        const newSortOrder = sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        setSortOrder(newSortOrder);
    };

    return (
        <OrderToggleButton onToggle={handleToggleSortOrder} sortOrder={sortOrder as SortOrder} />
    );
};
