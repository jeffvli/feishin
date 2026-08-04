import type { AutocompleteProps as MantineAutocompleteProps } from '@mantine/core';

import { Autocomplete as MantineAutocomplete } from '@mantine/core';
import clsx from 'clsx';
import { CSSProperties, forwardRef } from 'react';

import styles from './autocomplete.module.css';

export interface AutocompleteProps extends MantineAutocompleteProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
    (
        {
            classNames,
            clearable = false,
            maxWidth,
            size = 'sm',
            style,
            variant = 'default',
            width,
            ...props
        }: AutocompleteProps,
        ref,
    ) => {
        return (
            <MantineAutocomplete
                classNames={{
                    description: styles.description,
                    dropdown: styles.dropdown,
                    input: clsx(styles.input, {
                        [styles.clearable]: clearable,
                    }),
                    label: styles.label,
                    option: styles.option,
                    root: styles.root,
                    section: styles.section,
                    ...classNames,
                }}
                clearable={clearable}
                clearButtonProps={{
                    classNames: {
                        root: styles.clearButton,
                    },
                }}
                ref={ref}
                size={size}
                spellCheck={false}
                style={{ maxWidth, width, ...style }}
                variant={variant}
                {...props}
            />
        );
    },
);
