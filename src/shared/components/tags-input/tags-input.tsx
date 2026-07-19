import {
    TagsInput as MantineTagsInput,
    TagsInputProps as MantineTagsInputProps,
} from '@mantine/core';
import { CSSProperties, useMemo } from 'react';

import styles from './tags-input.module.css';

export interface TagsInputProps extends MantineTagsInputProps {
    maxWidth?: CSSProperties['maxWidth'];
    width?: CSSProperties['width'];
}

const defaultClassNames = {
    dropdown: styles.dropdown,
    input: styles.input,
    inputField: styles.inputField,
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

export const TagsInput = ({
    classNames,
    maxWidth,
    variant = 'default',
    width,
    ...props
}: TagsInputProps) => {
    const mergedClassNames = useMemo(
        () => (classNames ? { ...defaultClassNames, ...classNames } : defaultClassNames),
        [classNames],
    );

    const style = useMemo(
        () => (maxWidth || width ? { maxWidth, width } : undefined),
        [maxWidth, width],
    );

    return (
        <MantineTagsInput
            classNames={mergedClassNames}
            clearButtonProps={defaultClearButtonProps}
            style={style}
            variant={variant}
            {...props}
        />
    );
};
