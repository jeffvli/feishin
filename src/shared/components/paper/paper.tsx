import type { PaperProps as MantinePaperProps } from '@mantine/core';

import { Paper as MantinePaper } from '@mantine/core';
import { ReactNode } from 'react';

import styles from './paper.module.css';

export interface PaperProps extends MantinePaperProps {
    children?: ReactNode;
}

export const Paper = ({ children, classNames, style, ...props }: PaperProps) => {
    return (
        <MantinePaper
            classNames={{
                root: styles.root,
                ...classNames,
            }}
            style={{
                ...style,
            }}
            {...props}
        >
            {children}
        </MantinePaper>
    );
};
