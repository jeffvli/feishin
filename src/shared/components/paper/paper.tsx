import type { PaperProps as MantinePaperProps } from '@mantine/core';

import { Paper as MantinePaper } from '@mantine/core';
import { memo, ReactNode, useMemo } from 'react';

import styles from './paper.module.css';

export interface PaperProps extends MantinePaperProps {
    children?: ReactNode;
}

const BasePaper = ({ children, classNames, style, ...props }: PaperProps) => {
    const memoizedClassNames = useMemo(
        () => ({
            root: styles.root,
            ...classNames,
        }),
        [classNames],
    );

    const memoizedStyle = useMemo(() => ({ ...style }), [style]);

    return (
        <MantinePaper classNames={memoizedClassNames} style={memoizedStyle} {...props}>
            {children}
        </MantinePaper>
    );
};

BasePaper.displayName = 'Paper';

export const Paper = memo(BasePaper);
