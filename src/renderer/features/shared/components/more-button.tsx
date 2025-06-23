import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';

interface MoreButtonProps extends ActionIconProps {}

export const MoreButton = ({ ...props }: MoreButtonProps) => {
    return (
        <ActionIcon
            icon="ellipsisHorizontal"
            iconProps={{
                size: 'lg',
                ...props.iconProps,
            }}
            variant="subtle"
            {...props}
        />
    );
};
