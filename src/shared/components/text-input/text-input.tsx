import {
    TextInput as MantineTextInput,
    TextInputProps as MantineTextInputProps,
} from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './text-input.module.css';

export interface TextInputProps extends MantineTextInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
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
        }: TextInputProps,
        ref,
    ) => {
        return (
            <MantineTextInput
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
                spellCheck={false}
                style={{ maxWidth, width, ...style }}
                variant={variant}
                {...props}
            >
                {children}
            </MantineTextInput>
        );
    },
);
