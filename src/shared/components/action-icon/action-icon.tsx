import {
    ElementProps,
    ActionIcon as MantineActionIcon,
    ActionIconProps as MantineActionIconProps,
} from '@mantine/core';
import { forwardRef } from 'react';

import styles from './action-icon.module.css';

import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface ActionIconProps
    extends ElementProps<'button', keyof MantineActionIconProps>,
        MantineActionIconProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const _ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(
    ({ classNames, variant = 'default', ...props }, ref) => {
        return (
            <MantineActionIcon
                classNames={{
                    root: styles.root,
                    ...classNames,
                }}
                ref={ref}
                variant={variant}
                {...props}
            />
        );
    },
);

export const ActionIcon = createPolymorphicComponent<'button', ActionIconProps>(_ActionIcon);
