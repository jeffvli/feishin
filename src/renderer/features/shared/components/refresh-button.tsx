import { useTranslation } from 'react-i18next';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';

interface RefreshButtonProps extends ActionIconProps {
    loading?: boolean;
}

export const RefreshButton = ({ loading, onClick, ...props }: RefreshButtonProps) => {
    const { t } = useTranslation();

    return (
        <ActionIcon
            icon="refresh"
            iconProps={{
                size: 'lg',
                ...props.iconProps,
            }}
            loading={loading}
            onClick={onClick}
            tooltip={{
                label: t('common.refresh', { postProcess: 'sentenceCase' }),
                ...props.tooltip,
            }}
            variant="subtle"
            {...props}
        />
    );
};
