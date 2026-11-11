import type { ComponentProps } from 'react';

import { useLayoutEffect, useRef } from 'react';

import styles from './desktop-lyrics-window.module.css';

import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';

export const DesktopLyricsLine = ({
    elapsedMs = 0,
    playing = true,
    scrollDurationMs = 4000,
    text,
    ...props
}: ComponentProps<typeof LyricLine> & {
    elapsedMs?: number;
    playing?: boolean;
    scrollDurationMs?: number;
}) => {
    const viewport = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const element = viewport.current;
        if (!element || scrollDurationMs <= 1000) return;
        let animations: Animation[] = [];
        const measure = () => {
            animations.forEach((animation) => animation.cancel());
            animations = [];
            for (const span of element.querySelectorAll<HTMLSpanElement>('[data-lyric-text]')) {
                const overflow = Math.max(0, span.scrollWidth - element.clientWidth);
                span.dataset.overflow = String(overflow > 0);
                if (overflow > 0) {
                    // At least 20px/s; short intervals have no maximum speed.
                    const movementMs = Math.min(scrollDurationMs - 1000, (overflow * 1000) / 20);
                    const duration = scrollDurationMs;
                    const animation = span.animate(
                        [
                            { offset: 0, transform: 'translateX(0)' },
                            { offset: 500 / duration, transform: 'translateX(0)' },
                            {
                                offset: (500 + movementMs) / duration,
                                transform: `translateX(-${overflow}px)`,
                            },
                            { offset: 1, transform: `translateX(-${overflow}px)` },
                        ],
                        {
                            duration,
                            easing: 'linear',
                            fill: 'forwards',
                        },
                    );
                    animation.pause();
                    animation.currentTime = Math.max(0, elapsedMs);
                    if (playing) animation.play();
                    animations.push(animation);
                }
            }
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        element
            .querySelectorAll<HTMLSpanElement>('[data-lyric-text]')
            .forEach((span) => observer.observe(span));
        measure();
        return () => {
            observer.disconnect();
            animations.forEach((animation) => animation.cancel());
        };
    }, [elapsedMs, playing, props.fontSize, props.romajiText, scrollDurationMs, text]);
    return (
        <div
            className={styles.viewport}
            data-alignment={props.alignment}
            data-scrolling={scrollDurationMs > 0}
            ref={viewport}
        >
            <div className={styles.lineLayers}>
                <LyricLine {...props} aria-hidden="true" data-outline="true" text={text} />
                <LyricLine {...props} data-outline="false" text={text} />
            </div>
        </div>
    );
};
