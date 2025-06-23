import {
    MultiSelect as MantineMultiSelect,
    MultiSelectProps as MantineMultiSelectProps,
} from '@mantine/core';
import { CSSProperties } from 'react';

import styles from './multi-select.module.css';

export interface MultiSelectProps extends MantineMultiSelectProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

export const MultiSelect = ({
    classNames,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: MultiSelectProps) => {
    return (
        <MantineMultiSelect
            classNames={{
                dropdown: styles.dropdown,
                input: styles.input,
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
