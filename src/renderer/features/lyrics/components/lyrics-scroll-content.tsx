import clsx from 'clsx';
import { useMemo } from 'react';

import styles from './lyrics-scroll-content.module.css';

export interface LyricsScrollContentProps {
    bottomScrollPadding?: string;
    children: React.ReactNode;
    className?: string;
    gap?: number;
    preview?: boolean;
    style?: React.CSSProperties;
}

export const LyricsScrollContent = ({
    bottomScrollPadding = '50vh',
    children,
    className,
    gap,
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
            gap: gap !== undefined ? `${gap}px` : undefined,
            paddingBottom: bottomScrollPadding,
            paddingTop: '2rem',
            ...style,
        } as React.CSSProperties;
    }, [bottomScrollPadding, gap, preview, style]);

    return (
        <div
            className={clsx(styles.content, preview && styles.preview, className)}
            style={contentStyle}
        >
            {children}
        </div>
    );
};
