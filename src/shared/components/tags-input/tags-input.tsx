import {
    TagsInput as MantineTagsInput,
    TagsInputProps as MantineTagsInputProps,
} from '@mantine/core';
import clsx from 'clsx';
import { CSSProperties, useMemo } from 'react';

import styles from './tags-input.module.css';

export interface TagsInputProps extends MantineTagsInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

const defaultClearButtonProps = {
    classNames: {
        root: styles.clearButton,
    },
};

export const TagsInput = ({
    classNames,
    clearable = false,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: TagsInputProps) => {
    const mergedClassNames = useMemo(
        () => ({
            description: styles.description,
            dropdown: styles.dropdown,
            input: clsx(styles.input, {
                [styles.clearable]: clearable,
            }),
            inputField: styles.inputField,
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
        <MantineTagsInput
            classNames={mergedClassNames}
            clearable={clearable}
            clearButtonProps={defaultClearButtonProps}
            style={style}
            variant={variant}
            {...props}
        />
    );
};
