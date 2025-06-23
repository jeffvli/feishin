import {
    NumberInput as MantineNumberInput,
    NumberInputProps as MantineNumberInputProps,
} from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './number-input.module.css';

export interface NumberInputProps extends MantineNumberInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    (
        {
            children,
            classNames,
            maxWidth,
            size = 'sm',
            style,
            variant = 'default',
            width,
            ...props
        }: NumberInputProps,
        ref,
    ) => {
        return (
            <MantineNumberInput
                classNames={{
                    control: styles.control,
                    input: styles.input,
                    label: styles.label,
                    required: styles.required,
                    root: styles.root,
                    section: styles.section,
                    wrapper: styles.wrapper,
                    ...classNames,
                }}
                hideControls
                ref={ref}
                size={size}
                style={{ maxWidth, width, ...style }}
                variant={variant}
                {...props}
            >
                {children}
            </MantineNumberInput>
        );
    },
);
