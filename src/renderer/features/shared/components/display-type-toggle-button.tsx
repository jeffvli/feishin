import { useTranslation } from 'react-i18next';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { ListDisplayType } from '/@/shared/types/types';

interface DisplayTypeToggleButtonProps {
    buttonProps?: Partial<ActionIconProps>;
    displayType: ListDisplayType;
    onToggle: () => void;
}

export const DisplayTypeToggleButton = ({
    buttonProps,
    displayType,
    onToggle,
}: DisplayTypeToggleButtonProps) => {
    const { t } = useTranslation();
    const isGrid = displayType === ListDisplayType.GRID;
    const isDetail = displayType === ListDisplayType.DETAIL;

    return (
        <ActionIcon
            icon={isGrid ? 'layoutGrid' : isDetail ? 'layoutDetail' : 'layoutTable'}
            iconProps={{
                size: 'lg',
            }}
            onClick={onToggle}
            tooltip={{
                label: isGrid
                    ? t('table.config.view.grid', { postProcess: 'sentenceCase' })
                    : isDetail
                      ? t('table.config.view.detail', { postProcess: 'sentenceCase' })
                      : t('table.config.view.table', { postProcess: 'sentenceCase' }),
            }}
            variant="subtle"
            {...buttonProps}
        />
    );
};
