import { Textarea as MantineTextarea, TextareaProps as MantineTextareaProps } from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './textarea.module.css';

export interface TextareaProps extends MantineTextareaProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        }: TextareaProps,
        ref,
    ) => {
        return (
            <MantineTextarea
                classNames={{
                    input: styles.input,
                    label: styles.label,
                    required: styles.required,
                    root: styles.root,
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
            </MantineTextarea>
        );
    },
);
