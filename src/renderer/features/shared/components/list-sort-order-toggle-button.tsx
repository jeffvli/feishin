import { OrderToggleButton } from '/@/renderer/features/shared/components/order-toggle-button';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ListSortOrderToggleButtonProps {
    defaultSortOrder: SortOrder;
    disabled?: boolean;
    listKey: ItemListKey;
}

export const ListSortOrderToggleButton = ({
    defaultSortOrder,
    disabled,
    listKey,
}: ListSortOrderToggleButtonProps) => {
    const { setSortOrder, sortOrder } = useSortOrderFilter(defaultSortOrder, listKey);

    const handleToggleSortOrder = () => {
        const newSortOrder = sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        setSortOrder(newSortOrder);
    };

    return (
        <OrderToggleButton
            disabled={disabled}
            onToggle={handleToggleSortOrder}
            sortOrder={sortOrder as SortOrder}
        />
    );
};

interface ListSortOrderToggleButtonControlledProps {
    disabled?: boolean;
    setSortOrder: (sortOrder: SortOrder) => void;
    sortOrder: SortOrder;
}

export const ListSortOrderToggleButtonControlled = ({
    disabled,
    setSortOrder,
    sortOrder,
}: ListSortOrderToggleButtonControlledProps) => {
    return (
        <OrderToggleButton
            disabled={disabled}
            onToggle={() =>
                setSortOrder(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
            }
            sortOrder={sortOrder as SortOrder}
        />
    );
};
