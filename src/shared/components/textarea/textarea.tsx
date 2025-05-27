import { Textarea as MantineTextarea, TextareaProps as MantineTextareaProps } from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './textarea.module.css';

export interface TextareaProps extends MantineTextareaProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ children, classNames, maxWidth, style, width, ...props }: TextareaProps, ref) => {
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
                style={{ maxWidth, width, ...style }}
                {...props}
            >
                {children}
            </MantineTextarea>
        );
    },
);
