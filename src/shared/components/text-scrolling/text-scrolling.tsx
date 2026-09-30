import { TextProps as MantineTextProps } from '@mantine/core';
import {
    ComponentPropsWithoutRef,
    CSSProperties,
    ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import styles from './text-scrolling.module.css';

import { Text, TextProps } from '/@/shared/components/text/text';
import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface TextScrollingProps extends MantineTextDivProps, TextProps {
    children?: ReactNode;
    gap: number; // gap between finish and start of new sentence
    pause: number; // pause between repitions
    speed: number; // pixels per second
}

type MantineTextDivProps = ComponentPropsWithoutRef<'div'> & MantineTextProps;

export const BaseTextScrolling = ({ children, gap, pause, speed, ...rest }: TextScrollingProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const textRef = useRef<HTMLDivElement | null>(null);

    const [isOverflowing, setIsOverflowing] = useState(false);
    const [scrollDistance, setScrollDistance] = useState(0);

    useLayoutEffect(() => {
        const checkOverflow = () => {
            const container = containerRef.current;
            const text = textRef.current;
            const track = trackRef.current;

            if (!container || !text) {
                return;
            }

            const overflow = text.scrollWidth - container.clientWidth;

            // A title that fits must never inherit a previous title's scroll
            // position: clear any running animation and snap back to origin.
            if (overflow <= 0 && track) {
                track.getAnimations().forEach((animation) => animation.cancel());
                track.style.transform = '';
            }

            setIsOverflowing(overflow > 0);
            setScrollDistance(text.scrollWidth);
        };

        checkOverflow();

        // Webfonts (e.g. the 900-weight title face) change text width after
        // first paint; re-check once they settle so short titles are not
        // stuck in a stale overflowing state.
        let fontsDone = false;
        document.fonts?.ready.then(() => {
            if (!fontsDone) {
                checkOverflow();
            }
        });

        window.addEventListener('resize', checkOverflow);

        return () => {
            fontsDone = true;
            window.removeEventListener('resize', checkOverflow);
        };
    }, [children]);

    useEffect(() => {
        if (!isOverflowing) {
            return;
        }

        const track = trackRef.current;
        if (!track) {
            return;
        }

        let cancelled = false;

        const distance = scrollDistance + gap;
        const duration = (distance / speed) * 1000;

        const sleep = (ms: number) =>
            new Promise<void>((resolve) => {
                const start = performance.now();

                function frame(now: number) {
                    if (cancelled || now - start >= ms) {
                        resolve();
                        return;
                    }

                    requestAnimationFrame(frame);
                }

                requestAnimationFrame(frame);
            });

        const run = async () => {
            while (!cancelled) {
                // Ensure we're back at the start.
                track.style.transform = 'translateX(0)';

                // Pause before scrolling.
                await sleep(pause * 1000);

                if (cancelled) {
                    break;
                }

                const animation = track.animate(
                    [{ transform: 'translateX(0)' }, { transform: `translateX(-${distance}px)` }],
                    {
                        duration,
                        easing: 'linear',
                        fill: 'forwards',
                    },
                );

                await animation.finished.catch(() => {});
            }
        };

        run();

        return () => {
            cancelled = true;
            track.getAnimations().forEach((a) => a.cancel());
        };
    }, [isOverflowing, scrollDistance, gap, pause, speed]);

    // Remount the track per title so scroll state (overflow flag, distance,
    // transform) from a previous title can never leak into the next one.
    const trackKey = typeof children === 'string' ? children : 'text-scrolling-track';

    return (
        <div className={styles.scrollingTextContainer} ref={containerRef}>
            <div
                className={styles.track}
                key={trackKey}
                ref={trackRef}
                style={{ '--scroll-gap': `${gap}px` } as CSSProperties}
            >
                <Text ref={textRef} {...rest}>
                    {children}
                </Text>

                {isOverflowing && (
                    <Text aria-hidden {...rest}>
                        {children}
                    </Text>
                )}
            </div>
        </div>
    );
};

export const TextScrolling = createPolymorphicComponent<'div', TextScrollingProps>(
    BaseTextScrolling,
);
