import {
    MultiSelect as MantineMultiSelect,
    MultiSelectProps as MantineMultiSelectProps,
} from '@mantine/core';
import clsx from 'clsx';
import { CSSProperties, useMemo } from 'react';

import styles from './multi-select.module.css';

export interface MultiSelectProps extends MantineMultiSelectProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

const defaultClearButtonProps = {
    classNames: {
        root: styles.clearButton,
    },
};

export const MultiSelect = ({
    classNames,
    clearable = false,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: MultiSelectProps) => {
    const mergedClassNames = useMemo(
        () => ({
            description: styles.description,
            dropdown: styles.dropdown,
            input: clsx(styles.input, {
                [styles.clearable]: clearable,
            }),
            label: styles.label,
            option: styles.option,
            pill: styles.pill,
            pillsList: styles.pillsList,
            root: styles.root,
            ...classNames,
        }),
        [classNames, clearable],
    );

    const style = useMemo(
        () => (maxWidth || width ? { maxWidth, width } : undefined),
        [maxWidth, width],
    );

    return (
        <MantineMultiSelect
            classNames={mergedClassNames}
            clearable={clearable}
            clearButtonProps={defaultClearButtonProps}
            style={style}
            variant={variant}
            withCheckIcon={false}
            {...props}
        />
    );
};
