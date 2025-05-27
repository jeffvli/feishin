import { useTranslation } from 'react-i18next';
import { RiSortAsc, RiSortDesc } from 'react-icons/ri';

import { Button, ButtonProps } from '/@/shared/components/button/button';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { SortOrder } from '/@/shared/types/domain-types';

interface OrderToggleButtonProps {
    buttonProps?: Partial<ButtonProps>;
    onToggle: () => void;
    sortOrder: SortOrder;
}

export const OrderToggleButton = ({ buttonProps, onToggle, sortOrder }: OrderToggleButtonProps) => {
    const { t } = useTranslation();
    return (
        <Tooltip
            label={
                sortOrder === SortOrder.ASC
                    ? t('common.ascending', { postProcess: 'sentenceCase' })
                    : t('common.descending', { postProcess: 'sentenceCase' })
            }
        >
            <Button
                fw="600"
                onClick={onToggle}
                size="compact-md"
                variant="subtle"
                {...buttonProps}
            >
                <>{sortOrder === SortOrder.ASC ? <RiSortAsc /> : <RiSortDesc />}</>
            </Button>
        </Tooltip>
    );
};
