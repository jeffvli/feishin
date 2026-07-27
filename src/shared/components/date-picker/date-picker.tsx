import type {
    DateInputProps as MantineDateInputProps,
    DateTimePickerProps as MantineDateTimeInputProps,
} from '@mantine/dates';

import {
    DateInput as MantineDateInput,
    DateTimePicker as MantineDateTimeInput,
} from '@mantine/dates';

import styles from './date-picker.module.css';

interface DateInputProps extends MantineDateInputProps {
    maxWidth?: number | string;
    width?: number | string;
}

export const DateInput = ({
    classNames,
    maxWidth,
    size = 'sm',
    style,
    width,
    ...props
}: DateInputProps) => {
    return (
        <MantineDateInput
            classNames={{
                description: styles.description,
                input: styles.input,
                label: styles.label,
                required: styles.required,
                root: styles.root,
                section: styles.section,
                ...classNames,
            }}
            size={size}
            style={{ maxWidth, width, ...style }}
            {...props}
        />
    );
};

interface DateTimeInputProps extends MantineDateTimeInputProps {
    maxWidth?: number | string;
    width?: number | string;
}

export const DateTimeInput = ({
    classNames,
    maxWidth,
    size = 'sm',
    style,
    width,
    ...props
}: DateTimeInputProps) => {
    return (
        <MantineDateTimeInput
            classNames={{
                description: styles.description,
                input: styles.input,
                label: styles.label,
                required: styles.required,
                root: styles.root,
                section: styles.section,
                ...classNames,
            }}
            size={size}
            style={{ maxWidth, width, ...style }}
            {...props}
        />
    );
};
