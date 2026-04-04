import { Spoiler as MantineSpoiler, SpoilerProps as MantineSpoilerProps } from '@mantine/core';
import { ReactNode, useState } from 'react';

import styles from './spoiler.module.css';

import { Icon } from '/@/shared/components/icon/icon';

interface SpoilerProps extends Omit<MantineSpoilerProps, 'hideLabel' | 'showLabel'> {
    children?: ReactNode;
    hideLabel?: ReactNode;
    showLabel?: ReactNode;
}

export const Spoiler = ({
    children,
    hideLabel,
    maxHeight = 56,
    showLabel,
    ...props
}: SpoilerProps) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <MantineSpoiler
            classNames={{ content: styles.spoiler, control: styles.control }}
            expanded={expanded}
            maxHeight={maxHeight}
            {...props}
            hideLabel={hideLabel ?? <Icon icon="arrowUpS" size="lg" />}
            onClick={() => setExpanded(!expanded)}
            showLabel={showLabel ?? <Icon icon="arrowDownS" size="lg" />}
        >
            {children}
        </MantineSpoiler>
    );
};
