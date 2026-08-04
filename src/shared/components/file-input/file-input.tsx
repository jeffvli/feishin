import {
    FileInput as MantineFileInput,
    FileInputProps as MantineFileInputProps,
} from '@mantine/core';
import clsx from 'clsx';
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
            clearable = false,
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
                    description: styles.description,
                    input: clsx(styles.input, {
                        [styles.clearable]: clearable,
                    }),
                    label: styles.label,
                    required: styles.required,
                    root: styles.root,
                    section: styles.section,
                    wrapper: styles.wrapper,
                    ...classNames,
                }}
                clearable={clearable}
                clearButtonProps={{
                    className: styles.clearButton,
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
