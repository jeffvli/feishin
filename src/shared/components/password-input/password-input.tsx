import {
    PasswordInput as MantinePasswordInput,
    PasswordInputProps as MantinePasswordInputProps,
} from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './password-input.module.css';

export interface PasswordInputProps extends MantinePasswordInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ children, classNames, maxWidth, style, variant = 'default', width, ...props }, ref) => {
        return (
            <MantinePasswordInput
                classNames={{
                    input: styles.input,
                    label: styles.label,
                    required: styles.required,
                    root: styles.root,
                    section: styles.section,
                    ...classNames,
                }}
                ref={ref}
                style={{ maxWidth, width, ...style }}
                variant={variant}
                {...props}
            >
                {children}
            </MantinePasswordInput>
        );
    },
);
