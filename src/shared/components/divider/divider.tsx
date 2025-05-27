import { Divider as MantineDivider, DividerProps as MantineDividerProps } from '@mantine/core';
import { forwardRef } from 'react';

import styles from './divider.module.css';

export interface DividerProps extends MantineDividerProps {}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
    ({ classNames, style, ...props }, ref) => {
        return (
            <MantineDivider
                classNames={{ root: styles.root, ...classNames }}
                ref={ref}
                style={{ ...style }}
                {...props}
            />
        );
    },
);
