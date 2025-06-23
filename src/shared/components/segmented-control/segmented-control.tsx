import type { SegmentedControlProps as MantineSegmentedControlProps } from '@mantine/core';

import { SegmentedControl as MantineSegmentedControl } from '@mantine/core';
import { forwardRef } from 'react';

import styles from './segmented-control.module.css';

type SegmentedControlProps = MantineSegmentedControlProps;

export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
    ({ classNames, size = 'sm', ...props }: SegmentedControlProps, ref) => {
        return (
            <MantineSegmentedControl
                classNames={{
                    control: styles.control,
                    indicator: styles.indicator,
                    label: styles.label,
                    root: styles.root,
                    ...classNames,
                }}
                ref={ref}
                size={size}
                transitionDuration={250}
                transitionTimingFunction="linear"
                {...props}
            />
        );
    },
);
