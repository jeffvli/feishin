import type { SelectProps as MantineSelectProps } from '@mantine/core';

import { Select as MantineSelect } from '@mantine/core';
import { CSSProperties } from 'react';

import styles from './select.module.css';

export interface SelectProps extends MantineSelectProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const Select = ({
    classNames,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: SelectProps) => {
    return (
        <MantineSelect
            classNames={{
                dropdown: styles.dropdown,
                input: styles.input,
                label: styles.label,
                option: styles.option,
                root: styles.root,
                ...classNames,
            }}
            style={{ maxWidth, width }}
            variant={variant}
            withCheckIcon={false}
            {...props}
        />
    );
};
