import type { ButtonVariant, ButtonProps as MantineButtonProps } from '@mantine/core';

import { ElementProps, Button as MantineButton } from '@mantine/core';
import clsx from 'clsx';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from './button.module.css';

import { Tooltip, TooltipProps } from '/@/shared/components/tooltip/tooltip';
import { useTimeout } from '/@/shared/hooks/use-timeout';
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
        const memoizedClassNames = useMemo(
            () => ({
                inner: styles.inner,
                label: clsx(styles.label, {
                    [styles.uppercase]: uppercase,
                }),
                loader: styles.loader,
                root: styles.root,
                section: styles.section,
                ...classNames,
            }),
            [classNames, uppercase],
        );

        if (tooltip) {
            return (
                <Tooltip withinPortal {...tooltip}>
                    <MantineButton
                        autoContrast
                        classNames={memoizedClassNames}
                        loading={loading}
                        ref={ref}
                        size={size}
                        style={style}
                        variant={variant}
                        {...props}
                    >
                        {children}
                    </MantineButton>
                </Tooltip>
            );
        }

        return (
            <MantineButton
                classNames={memoizedClassNames}
                loading={loading}
                ref={ref}
                size={size}
                style={style}
                variant={variant}
                {...props}
            >
                {children}
            </MantineButton>
        );
    },
);

export const Button = createPolymorphicComponent<'button', ButtonProps>(_Button);

export const ButtonGroup = MantineButton.Group;

export const ButtonGroupSection = MantineButton.GroupSection;

interface TimeoutButtonProps extends ButtonProps {
    timeoutProps: {
        callback: () => void;
        duration: number;
    };
}

export const TimeoutButton = ({ timeoutProps, ...props }: TimeoutButtonProps) => {
    const [, setTimeoutRemaining] = useState(timeoutProps.duration);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<null | number>(null);

    const callback = () => {
        timeoutProps.callback();
        setTimeoutRemaining(timeoutProps.duration);
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
    };

    const { clear, start } = useTimeout(callback, timeoutProps.duration);

    useEffect(() => {
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    const startTimeout = useCallback(() => {
        if (isRunning) {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
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
        <Button onClick={startTimeout} {...props}>
            {isRunning ? 'Cancel' : props.children}
        </Button>
    );
};
