import clsx from 'clsx';
import { motion } from 'motion/react';
import { forwardRef, ReactNode } from 'react';

import styles from './player-button.module.css';

import { ActionIcon, ActionIconProps } from '/@/shared/components/action-icon/action-icon';
import { Tooltip, TooltipProps } from '/@/shared/components/tooltip/tooltip';

interface PlayerButtonProps extends Omit<ActionIconProps, 'icon' | 'variant'> {
    icon: ReactNode;
    isActive?: boolean;
    tooltip?: Omit<TooltipProps, 'children'>;
    variant: 'main' | 'secondary' | 'tertiary';
}

export const PlayerButton = forwardRef<HTMLDivElement, PlayerButtonProps>(
    ({ icon, isActive, tooltip, variant, ...rest }: PlayerButtonProps, ref) => {
        if (tooltip) {
            return (
                <Tooltip {...tooltip}>
                    <motion.div
                        className={clsx({
                            [styles.main]: variant === 'main',
                            [styles.motionWrapper]: true,
                        })}
                        ref={ref}
                    >
                        <ActionIcon
                            className={clsx(styles.playerButton, styles[variant], {
                                [styles.active]: isActive,
                            })}
                            {...rest}
                            onClick={(e) => {
                                e.stopPropagation();
                                rest.onClick?.(e);
                            }}
                            variant="transparent"
                        >
                            {icon}
                        </ActionIcon>
                    </motion.div>
                </Tooltip>
            );
        }

        return (
            <motion.div
                className={clsx({
                    [styles.main]: variant === 'main',
                    [styles.motionWrapper]: true,
                })}
                ref={ref}
            >
                <ActionIcon
                    className={clsx(styles.playerButton, styles[variant], {
                        [styles.active]: isActive,
                    })}
                    {...rest}
                    onClick={(e) => {
                        e.stopPropagation();
                        rest.onClick?.(e);
                    }}
                    size="compact-md"
                    variant="transparent"
                >
                    {icon}
                </ActionIcon>
            </motion.div>
        );
    },
);
