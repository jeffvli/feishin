import { ButtonProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { RiSortAsc, RiSortDesc } from 'react-icons/ri';
import { SortOrder } from '/@/renderer/api/types';
import { Button, Tooltip } from '/@/renderer/components';

interface OrderToggleButtonProps {
    buttonProps?: Partial<ButtonProps>;
    onToggle: () => void;
    sortOrder: SortOrder;
}

export const OrderToggleButton = ({ sortOrder, onToggle, buttonProps }: OrderToggleButtonProps) => {
    const { t } = useTranslation();
    return (
        <Tooltip
            label={
                sortOrder === SortOrder.ASC
                    ? t('common.ascending', { postProcess: 'titleCase' })
                    : t('common.descending', { postProcess: 'titleCase' })
            }
        >
            <Button
                fw="600"
                size="compact-md"
                variant="subtle"
                onClick={onToggle}
                {...buttonProps}
            >
                <>
                    {sortOrder === SortOrder.ASC ? (
                        <RiSortAsc size="1.3rem" />
                    ) : (
                        <RiSortDesc size="1.3rem" />
                    )}
                </>
            </Button>
        </Tooltip>
    );
};
