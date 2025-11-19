import type { SelectProps as MantineSelectProps } from '@mantine/core';

import { Select as MantineSelect } from '@mantine/core';
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
                dropdown: styles.dropdown,
                input: styles.input,
                label: styles.label,
                option: styles.option,
                root: styles.root,
                section: styles.section,
                ...classNames,
            }}
            clearable={false}
            style={{ maxWidth, width }}
            variant={variant}
            withCheckIcon={false}
            {...props}
        />
    );
};
