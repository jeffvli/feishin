import {
    ElementProps,
    Badge as MantineBadge,
    BadgeProps as MantineBadgeProps,
} from '@mantine/core';
import { useMemo } from 'react';

import styles from './badge.module.css';

import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface BadgeProps
    extends ElementProps<'div', keyof MantineBadgeProps>,
        MantineBadgeProps {}

const BaseBadge = ({ children, classNames, variant = 'default', ...props }: BadgeProps) => {
    const memoizedClassNames = useMemo(
        () => ({
            root: styles.root,
            ...classNames,
        }),
        [classNames],
    );

    return (
        <MantineBadge classNames={memoizedClassNames} radius="md" variant={variant} {...props}>
            {children}
        </MantineBadge>
    );
};

export const Badge = createPolymorphicComponent<'button', BadgeProps>(BaseBadge);
