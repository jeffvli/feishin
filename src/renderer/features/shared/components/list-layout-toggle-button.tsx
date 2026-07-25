import { useTranslation } from 'react-i18next';

import {
    applyColumnOrder,
    FLAT_COLUMN_ORDER,
    isColumnOrderActive,
} from '/@/renderer/components/item-list/item-table-list/column-presets';
import {
    getDefaultListSettings,
    useListSettings,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface ListLayoutToggleButtonProps {
    listKey: ItemListKey;
}

export const ListLayoutToggleButton = ({ listKey }: ListLayoutToggleButtonProps) => {
    const { t } = useTranslation();
    const list = useListSettings(listKey);
    const { setList } = useSettingsStoreActions();

    if (list?.display !== ListDisplayType.TABLE || !list.table?.columns) {
        return null;
    }

    const isFlat = isColumnOrderActive(list.table.columns, FLAT_COLUMN_ORDER);

    const handleToggle = () => {
        if (isFlat) {
            const defaultTable = getDefaultListSettings(listKey)?.table;
            if (!defaultTable) return;
            setList(listKey, {
                table: { columns: defaultTable.columns, size: defaultTable.size },
            });
            return;
        }

        setList(listKey, {
            table: {
                columns: applyColumnOrder(list.table.columns, FLAT_COLUMN_ORDER),
                size: 'compact',
            },
        });
    };

    return (
        <ActionIcon
            icon={isFlat ? 'layoutList' : 'layoutTable'}
            iconProps={{ size: 'lg' }}
            onClick={handleToggle}
            tooltip={{ label: t('table.config.layout.toggle') }}
            variant="subtle"
        />
    );
};
