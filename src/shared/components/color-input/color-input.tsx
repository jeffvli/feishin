import {
    ColorInput as MantineColorInput,
    ColorInputProps as MantineColorInputProps,
} from '@mantine/core';

import styles from './color-input.module.css';

export interface ColorInputProps extends MantineColorInputProps {}

export const ColorInput = ({ classNames, variant = 'default', ...props }: ColorInputProps) => {
    return (
        <MantineColorInput
            classNames={{
                dropdown: styles.dropdown,
                input: styles.input,
                label: styles.label,
                root: styles.root,
                ...classNames,
            }}
            variant={variant}
            {...props}
        />
    );
};
