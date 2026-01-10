import {
    MultiSelect as MantineMultiSelect,
    MultiSelectProps as MantineMultiSelectProps,
} from '@mantine/core';
import { CSSProperties, useMemo } from 'react';

import styles from './multi-select.module.css';

export interface MultiSelectProps extends MantineMultiSelectProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

const defaultClassNames = {
    dropdown: styles.dropdown,
    input: styles.input,
    label: styles.label,
    option: styles.option,
    pill: styles.pill,
    pillsList: styles.pillsList,
    root: styles.root,
};

const defaultClearButtonProps = {
    classNames: {
        root: styles.clearButton,
    },
    variant: 'transparent' as const,
};

export const MultiSelect = ({
    classNames,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: MultiSelectProps) => {
    const mergedClassNames = useMemo(
        () => (classNames ? { ...defaultClassNames, ...classNames } : defaultClassNames),
        [classNames],
    );

    const style = useMemo(
        () => (maxWidth || width ? { maxWidth, width } : undefined),
        [maxWidth, width],
    );

    return (
        <MantineMultiSelect
            classNames={mergedClassNames}
            clearButtonProps={defaultClearButtonProps}
            style={style}
            variant={variant}
            withCheckIcon={false}
            {...props}
        />
    );
};
