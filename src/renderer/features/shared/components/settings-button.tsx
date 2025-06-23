import { useTranslation } from 'react-i18next';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';

interface SettingsButtonProps extends ActionIconProps {}

export const SettingsButton = ({ ...props }: SettingsButtonProps) => {
    const { t } = useTranslation();

    return (
        <ActionIcon
            icon="settings"
            iconProps={{
                size: 'lg',
                ...props.iconProps,
            }}
            tooltip={{
                label: t('common.configure', { postProcess: 'sentenceCase' }),
                ...props.tooltip,
            }}
            variant="subtle"
            {...props}
        />
    );
};
