import { useTranslation } from 'react-i18next';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { SortOrder } from '/@/shared/types/domain-types';

interface OrderToggleButtonProps {
    buttonProps?: Partial<ActionIconProps>;
    onToggle: () => void;
    sortOrder: SortOrder;
}

export const OrderToggleButton = ({ buttonProps, onToggle, sortOrder }: OrderToggleButtonProps) => {
    const { t } = useTranslation();

    return (
        <ActionIcon
            icon={sortOrder === SortOrder.ASC ? 'sortAsc' : 'sortDesc'}
            iconProps={{
                size: 'lg',
            }}
            onClick={onToggle}
            tooltip={{
                label:
                    sortOrder === SortOrder.ASC
                        ? t('common.ascending', { postProcess: 'sentenceCase' })
                        : t('common.descending', { postProcess: 'sentenceCase' }),
            }}
            variant="subtle"
            {...buttonProps}
        />
    );
};
