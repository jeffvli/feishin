import {
    ElementProps,
    ActionIcon as MantineActionIcon,
    ActionIconProps as MantineActionIconProps,
} from '@mantine/core';
import { forwardRef } from 'react';

import styles from './action-icon.module.css';

import { AppIcon, Icon, IconProps } from '/@/shared/components/icon/icon';
import { Tooltip, TooltipProps } from '/@/shared/components/tooltip/tooltip';
import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface ActionIconProps
    extends ElementProps<'button', keyof MantineActionIconProps>,
        MantineActionIconProps {
    icon?: keyof typeof AppIcon;
    iconProps?: Omit<IconProps, 'icon'>;
    tooltip?: Omit<TooltipProps, 'children'>;
}

const _ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(
    (
        {
            children,
            classNames,
            icon,
            iconProps,
            size = 'sm',
            tooltip,
            variant = 'default',
            ...props
        },
        ref,
    ) => {
        const actionIconProps: ActionIconProps = {
            classNames: {
                root: styles.root,
                ...classNames,
            },
            size,
            variant,
            ...props,
        };

        if (tooltip && icon) {
            return (
                <Tooltip
                    withinPortal
                    {...tooltip}
                >
                    <MantineActionIcon
                        ref={ref}
                        {...actionIconProps}
                    >
                        <Icon
                            icon={icon}
                            size={actionIconProps.size}
                            {...iconProps}
                        />
                    </MantineActionIcon>
                </Tooltip>
            );
        }

        if (icon) {
            return (
                <MantineActionIcon
                    ref={ref}
                    {...actionIconProps}
                >
                    <Icon
                        icon={icon}
                        size={actionIconProps.size}
                        {...iconProps}
                    />
                </MantineActionIcon>
            );
        }

        if (tooltip) {
            return (
                <Tooltip
                    withinPortal
                    {...tooltip}
                >
                    <MantineActionIcon
                        ref={ref}
                        {...actionIconProps}
                    >
                        {children}
                    </MantineActionIcon>
                </Tooltip>
            );
        }

        return (
            <MantineActionIcon
                ref={ref}
                {...actionIconProps}
            >
                {children}
            </MantineActionIcon>
        );
    },
);

export const ActionIcon = createPolymorphicComponent<'button', ActionIconProps>(_ActionIcon);
export const ActionIconGroup = MantineActionIcon.Group;
export const ActionIconSection = MantineActionIcon.GroupSection;
