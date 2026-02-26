import {
    ElementProps,
    ActionIcon as MantineActionIcon,
    ActionIconProps as MantineActionIconProps,
} from '@mantine/core';
import { forwardRef, useMemo } from 'react';

import styles from './action-icon.module.css';

import { AppIcon, Icon, IconProps } from '/@/shared/components/icon/icon';
import { Tooltip, TooltipProps } from '/@/shared/components/tooltip/tooltip';
import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

const COMPACT_SIZES = ['compact-xs', 'compact-sm', 'compact-md'] as const;

const isCompactSize = (size: number | string | undefined): boolean => {
    return typeof size === 'string' && COMPACT_SIZES.includes(size as any);
};

export interface ActionIconProps
    extends ElementProps<'button', keyof MantineActionIconProps>,
        MantineActionIconProps {
    icon?: keyof typeof AppIcon;
    iconProps?: Omit<IconProps, 'icon'>;
    stopsPropagation?: boolean;
    tooltip?: Omit<TooltipProps, 'children'>;
}

const _ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(
    (
        {
            children,
            classNames,
            icon,
            iconProps,
            onClick,
            size = 'sm',
            stopsPropagation,
            tooltip,
            variant = 'default',
            ...props
        },
        ref,
    ) => {
        const handleClick = (e: any) => {
            if (stopsPropagation) e.stopPropagation();
            if (onClick) onClick(e);
        };

        const memoizedClassNames = useMemo(
            () => ({
                root: styles.root,
                ...classNames,
            }),
            [classNames],
        );

        const mantineSize = isCompactSize(size) ? 'sm' : size;
        const compactSize = isCompactSize(size) ? (size as string) : undefined;

        const actionIconProps: ActionIconProps & { 'data-size'?: string } = {
            classNames: memoizedClassNames,
            size: mantineSize,
            variant,
            ...props,
            onClick: handleClick,
            ...(compactSize && { 'data-size': compactSize }),
        };

        if (tooltip && icon) {
            return (
                <Tooltip withinPortal {...tooltip}>
                    <MantineActionIcon ref={ref} {...actionIconProps}>
                        <Icon icon={icon} size={actionIconProps.size} {...iconProps} />
                    </MantineActionIcon>
                </Tooltip>
            );
        }

        if (icon) {
            return (
                <MantineActionIcon ref={ref} {...actionIconProps}>
                    <Icon icon={icon} size={actionIconProps.size} {...iconProps} />
                </MantineActionIcon>
            );
        }

        if (tooltip) {
            return (
                <Tooltip withinPortal {...tooltip}>
                    <MantineActionIcon ref={ref} {...actionIconProps}>
                        {children}
                    </MantineActionIcon>
                </Tooltip>
            );
        }

        return (
            <MantineActionIcon ref={ref} {...actionIconProps}>
                {children}
            </MantineActionIcon>
        );
    },
);

export const ActionIcon = createPolymorphicComponent<'button', ActionIconProps>(_ActionIcon);
export const ActionIconGroup = MantineActionIcon.Group;
export const ActionIconSection = MantineActionIcon.GroupSection;
