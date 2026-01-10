import { Tooltip as MantineTooltip, TooltipProps as MantineTooltipProps } from '@mantine/core';
import clsx from 'clsx';
import { memo, useMemo } from 'react';

import styles from './tooltip.module.css';

export interface TooltipProps extends MantineTooltipProps {}

const DEFAULT_TRANSITION_PROPS = {
    duration: 250,
    transition: 'fade',
} as const;

const TooltipComponent = memo(
    ({
        children,
        classNames,
        openDelay = 500,
        transitionProps = DEFAULT_TRANSITION_PROPS,
        withinPortal = true,
        ...props
    }: TooltipProps) => {
        const memoizedClassNames = useMemo(
            () => ({
                ...classNames,
                tooltip: clsx(styles.tooltip, classNames?.['tooltip']),
            }),
            [classNames],
        );

        const memoizedTransitionProps = useMemo(
            () => transitionProps ?? DEFAULT_TRANSITION_PROPS,
            [transitionProps],
        );

        return (
            <MantineTooltip
                arrowSize={10}
                classNames={memoizedClassNames}
                multiline
                openDelay={openDelay}
                transitionProps={memoizedTransitionProps}
                withArrow
                withinPortal={withinPortal}
                {...props}
            >
                {children}
            </MantineTooltip>
        );
    },
);

TooltipComponent.displayName = 'Tooltip';

export const Tooltip = TooltipComponent as typeof TooltipComponent & {
    Group: typeof MantineTooltip.Group;
};

Tooltip.Group = MantineTooltip.Group;

Tooltip.Group = MantineTooltip.Group;
