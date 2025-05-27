import { Checkbox as MantineCheckbox, CheckboxProps as MantineCheckboxProps } from '@mantine/core';
import { forwardRef } from 'react';

import styles from './checkbox.module.css';

interface CheckboxProps extends MantineCheckboxProps {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ classNames, ...props }: CheckboxProps, ref) => {
        return (
            <MantineCheckbox
                classNames={{
                    input: styles.input,
                    label: styles.label,
                    ...classNames,
                }}
                ref={ref}
                {...props}
            />
        );
    },
);
