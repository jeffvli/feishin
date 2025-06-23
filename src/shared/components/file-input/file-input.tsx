import {
    FileInput as MantineFileInput,
    FileInputProps as MantineFileInputProps,
} from '@mantine/core';
import { CSSProperties, forwardRef } from 'react';

import styles from './file-input.module.css';

export interface FileInputProps extends MantineFileInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const FileInput = forwardRef<HTMLButtonElement, FileInputProps>(
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
            <MantineFileInput
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
            </MantineFileInput>
        );
    },
);
