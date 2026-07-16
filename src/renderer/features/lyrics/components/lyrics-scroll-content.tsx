import clsx from 'clsx';
import { useMemo } from 'react';

import styles from './lyrics-scroll-content.module.css';

export interface LyricsScrollContentProps {
    bottomScrollPadding?: string;
    children: React.ReactNode;
    className?: string;
    gap?: number;
    paddingLeft?: number;
    paddingRight?: number;
    style?: React.CSSProperties;
}

export const LyricsScrollContent = ({
    bottomScrollPadding = '50vh',
    children,
    className,
    gap,
    paddingLeft = 0,
    paddingRight = 0,
    style,
}: LyricsScrollContentProps) => {
    const contentStyle = useMemo(
        () =>
            ({
                '--lyric-padding-left': `${paddingLeft}%`,
                '--lyric-padding-right': `${paddingRight}%`,
                gap: gap !== undefined ? `${gap}px` : undefined,
                paddingBottom: bottomScrollPadding,
                paddingLeft: `${paddingLeft}%`,
                paddingRight: `${paddingRight}%`,
                paddingTop: '10vh',
                ...style,
            }) as React.CSSProperties,
        [bottomScrollPadding, gap, paddingLeft, paddingRight, style],
    );

    return (
        <div className={clsx(styles.content, className)} style={contentStyle}>
            {children}
        </div>
    );
};
