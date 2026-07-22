import type { AutocompleteProps as MantineAutocompleteProps } from '@mantine/core';

import { Autocomplete as MantineAutocomplete } from '@mantine/core';
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
                    dropdown: styles.dropdown,
                    input: styles.input,
                    label: styles.label,
                    option: styles.option,
                    root: styles.root,
                    section: styles.section,
                    ...classNames,
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
