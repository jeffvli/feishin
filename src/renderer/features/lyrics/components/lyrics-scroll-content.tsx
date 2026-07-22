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
    preview?: boolean;
    style?: React.CSSProperties;
}

export const LyricsScrollContent = ({
    bottomScrollPadding = '50vh',
    children,
    className,
    gap,
    paddingLeft = 0,
    paddingRight = 0,
    preview = false,
    style,
}: LyricsScrollContentProps) => {
    const contentStyle = useMemo(() => {
        if (preview) {
            return {
                gap: gap !== undefined ? `${gap}px` : undefined,
                padding: 0,
                ...style,
            } as React.CSSProperties;
        }

        return {
            '--lyric-padding-left': `${paddingLeft}%`,
            '--lyric-padding-right': `${paddingRight}%`,
            gap: gap !== undefined ? `${gap}px` : undefined,
            paddingBottom: bottomScrollPadding,
            paddingLeft: `${paddingLeft}%`,
            paddingRight: `${paddingRight}%`,
            paddingTop: '10vh',
            ...style,
        } as React.CSSProperties;
    }, [bottomScrollPadding, gap, paddingLeft, paddingRight, preview, style]);

    return (
        <div
            className={clsx(styles.content, preview && styles.preview, className)}
            style={contentStyle}
        >
            {children}
        </div>
    );
};
