import { Tooltip as MantineTooltip, TooltipProps as MantineTooltipProps } from '@mantine/core';

import styles from './tooltip.module.css';

export interface TooltipProps extends MantineTooltipProps {}

export const Tooltip = ({
    children,
    openDelay = 500,
    transitionProps = {
        duration: 250,
        transition: 'fade',
    },
    withinPortal = true,
    ...props
}: TooltipProps) => {
    return (
        <MantineTooltip
            classNames={{
                tooltip: styles.tooltip,
            }}
            multiline
            openDelay={openDelay}
            transitionProps={transitionProps}
            withinPortal={withinPortal}
            {...props}
        >
            {children}
        </MantineTooltip>
    );
};
