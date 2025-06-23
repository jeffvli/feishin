import { useTranslation } from 'react-i18next';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';

interface FolderButtonProps extends ActionIconProps {
    isActive?: boolean;
}

export const FolderButton = ({ isActive, ...props }: FolderButtonProps) => {
    const { t } = useTranslation();

    return (
        <ActionIcon
            icon="folder"
            iconProps={{
                fill: isActive ? 'primary' : undefined,
                size: 'lg',
                ...props.iconProps,
            }}
            tooltip={{
                label: t('entity.folder', { postProcess: 'sentenceCase' }),
                ...props.tooltip,
            }}
            variant="subtle"
            {...props}
        />
    );
};
