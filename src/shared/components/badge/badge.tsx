import {
    ElementProps,
    Badge as MantineBadge,
    BadgeProps as MantineBadgeProps,
} from '@mantine/core';

import styles from './badge.module.css';

import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface BadgeProps
    extends ElementProps<'div', keyof MantineBadgeProps>,
        MantineBadgeProps {}

const _Badge = ({ children, classNames, variant = 'default', ...props }: BadgeProps) => {
    return (
        <MantineBadge
            classNames={{ root: styles.root, ...classNames }}
            radius="md"
            variant={variant}
            {...props}
        >
            {children}
        </MantineBadge>
    );
};

export const Badge = createPolymorphicComponent<'button', BadgeProps>(_Badge);
