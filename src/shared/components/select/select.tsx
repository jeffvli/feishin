import type { SelectProps as MantineSelectProps } from '@mantine/core';

import { Select as MantineSelect } from '@mantine/core';
import clsx from 'clsx';
import { CSSProperties } from 'react';

import styles from './select.module.css';

export interface SelectProps extends MantineSelectProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const Select = ({
    allowDeselect = false,
    classNames,
    clearable = false,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: SelectProps) => {
    return (
        <MantineSelect
            allowDeselect={allowDeselect || clearable}
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
            spellCheck={false}
            style={{ maxWidth, width }}
            variant={variant}
            withCheckIcon={false}
            {...props}
        />
    );
};
