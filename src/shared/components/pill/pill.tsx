import { Pill as MantinePill, PillProps as MantinePillProps } from '@mantine/core';
import clsx from 'clsx';

import styles from './pill.module.css';

export const Pill = ({ children, size = 'md', ...props }: MantinePillProps) => {
    return (
        <MantinePill
            classNames={{
                label: clsx({
                    [styles.label]: true,
                    [styles.lg]: size === 'lg',
                    [styles.md]: size === 'md',
                    [styles.sm]: size === 'sm',
                    [styles.xl]: size === 'xl',
                    [styles.xs]: size === 'xs',
                }),
                remove: styles.remove,
                root: styles.root,
            }}
            size="md"
            {...props}
        >
            {children}
        </MantinePill>
    );
};

Pill.Group = MantinePill.Group;
