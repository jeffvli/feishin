import {
    JsonInput as MantineJsonInput,
    JsonInputProps as MantineJsonInputProps,
} from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './json-input.module.css';

export interface JsonInputProps extends MantineJsonInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const JsonInput = forwardRef<HTMLTextAreaElement, JsonInputProps>(
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
        },
        ref,
    ) => {
        return (
            <MantineJsonInput
                classNames={{
                    input: styles.input,
                    label: styles.label,
                    required: styles.required,
                    root: styles.root,
                    section: styles.section,
                    wrapper: styles.wrapper,
                    ...classNames,
                }}
                ref={ref}
                size={size}
                style={{ maxWidth, width, ...style }}
                variant={variant}
                {...props}
            >
                {children}
            </MantineJsonInput>
        );
    },
);
