import type { ButtonProps as MantineButtonProps } from '@mantine/core';

import { ElementProps, Button as MantineButton } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import clsx from 'clsx';
import { forwardRef, useCallback, useRef, useState } from 'react';

import styles from './button.module.css';

import { Spinner } from '/@/shared/components/spinner/spinner';
import { Tooltip, TooltipProps } from '/@/shared/components/tooltip/tooltip';
import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface ButtonProps
    extends ElementProps<'button', keyof MantineButtonProps>,
        MantineButtonProps,
        MantineButtonProps {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    tooltip?: Omit<TooltipProps, 'children'>;
    uppercase?: boolean;
}

export const _Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            classNames,
            loading,
            style,
            tooltip,
            uppercase,
            variant = 'default',
            ...props
        }: ButtonProps,
        ref,
    ) => {
        if (tooltip) {
            return (
                <Tooltip
                    withinPortal
                    {...tooltip}
                >
                    <MantineButton
                        autoContrast
                        classNames={{
                            label: styles.label,
                            loader: styles.loader,
                            root: clsx(styles.root, {
                                [styles.uppercase]: uppercase,
                            }),
                            section: styles.section,
                            ...classNames,
                        }}
                        ref={ref}
                        style={style}
                        variant={variant}
                        {...props}
                    >
                        <span
                            className={clsx(styles.buttonInner, {
                                [styles.loading]: loading,
                                [styles.uppercase]: uppercase,
                            })}
                        >
                            {children}
                        </span>
                        {loading && (
                            <div className={styles.spinner}>
                                <Spinner />
                            </div>
                        )}
                    </MantineButton>
                </Tooltip>
            );
        }

        return (
            <MantineButton
                classNames={{
                    loader: styles.loader,
                    root: styles.root,
                    section: styles.section,
                    ...classNames,
                }}
                ref={ref}
                style={style}
                variant={variant}
                {...props}
            >
                <span
                    className={clsx(styles.buttonInner, {
                        [styles.loading]: loading,
                        [styles.uppercase]: uppercase,
                    })}
                >
                    {children}
                </span>
                {loading && (
                    <div className={styles.spinner}>
                        <Spinner />
                    </div>
                )}
            </MantineButton>
        );
    },
);

export const Button = createPolymorphicComponent<'button', ButtonProps>(_Button);

interface TimeoutButtonProps extends ButtonProps {
    timeoutProps: {
        callback: () => void;
        duration: number;
    };
}

export const TimeoutButton = ({ timeoutProps, ...props }: TimeoutButtonProps) => {
    const [, setTimeoutRemaining] = useState(timeoutProps.duration);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(0);

    const callback = () => {
        timeoutProps.callback();
        setTimeoutRemaining(timeoutProps.duration);
        clearInterval(intervalRef.current);
        setIsRunning(false);
    };

    const { clear, start } = useTimeout(callback, timeoutProps.duration);

    const startTimeout = useCallback(() => {
        if (isRunning) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            clear();
        } else {
            setIsRunning(true);
            start();

            const intervalId = window.setInterval(() => {
                setTimeoutRemaining((prev) => prev - 100);
            }, 100);

            intervalRef.current = intervalId;
        }
    }, [clear, isRunning, start]);

    return (
        <Button
            onClick={startTimeout}
            style={{ color: 'var(--theme-colors-state-error)' }}
            {...props}
        >
            {isRunning ? 'Cancel' : props.children}
        </Button>
    );
};
