import type { DateInputProps as MantineDateInputProps } from '@mantine/dates';

import { DateInput as MantineDateInput } from '@mantine/dates';

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
