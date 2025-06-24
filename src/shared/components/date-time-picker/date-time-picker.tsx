import type { DateTimePickerProps as MantineDateTimePickerProps } from '@mantine/dates';

import { DateTimePicker as MantineDateTimePicker } from '@mantine/dates';

import styles from './date-time-picker.module.css';

interface DateTimePickerProps extends MantineDateTimePickerProps {
    maxWidth?: number | string;
    width?: number | string;
}

export const DateTimePicker = ({
    classNames,
    maxWidth,
    popoverProps,
    size = 'sm',
    style,
    width,
    ...props
}: DateTimePickerProps) => {
    return (
        <MantineDateTimePicker
            classNames={{
                input: styles.input,
                label: styles.label,
                required: styles.required,
                root: styles.root,
                section: styles.section,
                ...classNames,
            }}
            popoverProps={{ withinPortal: true, ...popoverProps }}
            size={size}
            style={{ maxWidth, width, ...style }}
            {...props}
        />
    );
};
