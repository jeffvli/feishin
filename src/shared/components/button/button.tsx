import type { ButtonVariant, ButtonProps as MantineButtonProps } from '@mantine/core';

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
    tooltip?: Omit<TooltipProps, 'children'>;
    uppercase?: boolean;
    variant?: ExtendedButtonVariant;
}

type ExtendedButtonVariant =
    | 'state-error'
    | 'state-info'
    | 'state-success'
    | 'state-warning'
    | ButtonVariant;

export const _Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            classNames,
            loading,
            size = 'sm',
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
                            label: clsx(styles.label, {
                                [styles.uppercase]: uppercase,
                            }),
                            loader: styles.loader,
                            root: styles.root,
                            section: styles.section,
                            ...classNames,
                        }}
                        ref={ref}
                        size={size}
                        style={style}
                        variant={variant}
                        {...props}
                    >
                        {children}
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
                    label: clsx(styles.label, {
                        [styles.uppercase]: uppercase,
                    }),
                    loader: styles.loader,
                    root: styles.root,
                    section: styles.section,
                    ...classNames,
                }}
                ref={ref}
                size={size}
                style={style}
                variant={variant}
                {...props}
            >
                {children}
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
            {...props}
        >
            {isRunning ? 'Cancel' : props.children}
        </Button>
    );
};
