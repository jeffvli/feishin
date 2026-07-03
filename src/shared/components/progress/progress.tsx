import type { ProgressProps as MantineProgressProps } from '@mantine/core';

import { Progress as MantineProgress } from '@mantine/core';
import { forwardRef } from 'react';

import styles from './progress.module.css';

export interface ProgressProps extends MantineProgressProps {}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
    ({ classNames, style, ...props }, ref) => {
        return (
            <MantineProgress
                classNames={{
                    root: styles.root,
                    section: styles.section,
                    ...classNames,
                }}
                ref={ref}
                style={{
                    ...style,
                }}
                {...props}
            />
        );
    },
);

Progress.displayName = 'Progress';
