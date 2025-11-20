import {
    Pill as MantinePill,
    PillGroupProps as MantinePillGroupProps,
    PillProps as MantinePillProps,
} from '@mantine/core';
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Link } from 'react-router';

import styles from './pill.module.css';

interface PillProps extends MantinePillProps {}

export const Pill = ({ children, classNames, radius = 'md', size = 'md', ...props }: PillProps) => {
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
                ...classNames,
            }}
            radius={radius}
            size={size}
            {...props}
        >
            {children}
        </MantinePill>
    );
};

interface PillGroupProps extends MantinePillGroupProps {}

const PillGroup = ({ children, classNames, gap = 'sm', ...props }: PillGroupProps) => {
    return (
        <MantinePill.Group
            classNames={{
                group: clsx(styles.group, {
                    [styles.lg]: gap === 'lg',
                    [styles.md]: gap === 'md',
                    [styles.sm]: gap === 'sm',
                    [styles.xl]: gap === 'xl',
                    [styles.xs]: gap === 'xs',
                }),
                ...classNames,
            }}
            gap={gap}
            {...props}
        >
            {children}
        </MantinePill.Group>
    );
};

Pill.Group = PillGroup;

interface PillLinkProps
    extends Omit<React.ComponentPropsWithoutRef<typeof Link>, keyof PillProps>,
        PillProps {}

export const PillLink = forwardRef<HTMLDivElement, PillLinkProps>(({ children, ...props }, ref) => {
    const { classNames, radius = 'md', size = 'md', ...rest } = props;

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
                root: clsx(styles.root, styles.link),
                ...classNames,
            }}
            component={Link}
            radius={radius}
            ref={ref}
            size={size}
            {...rest}
        >
            {children}
        </MantinePill>
    );
});
