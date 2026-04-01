import clsx from 'clsx';
import { type CSSProperties, memo, useEffect, useRef, useState } from 'react';

import styles from './skeleton.module.css';

interface SkeletonProps {
    baseColor?: string;
    borderRadius?: string;
    className?: string;
    containerClassName?: string;
    count?: number;
    direction?: 'ltr' | 'rtl';
    enableAnimation?: boolean;
    height?: number | string;
    inline?: boolean;
    isCentered?: boolean;
    style?: CSSProperties;
    width?: number | string;
}

export function BaseSkeleton({
    baseColor,
    borderRadius,
    className,
    containerClassName,
    count = 1,
    direction = 'ltr',
    enableAnimation = true,
    height,
    inline,
    isCentered,
    style,
    width,
}: SkeletonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInViewport, setIsInViewport] = useState(false);
    const [isDocumentVisible, setIsDocumentVisible] = useState(
        typeof document === 'undefined' ? true : document.visibilityState === 'visible',
    );

    useEffect(() => {
        if (!enableAnimation || typeof document === 'undefined') {
            return;
        }

        const handleVisibilityChange = () => {
            setIsDocumentVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enableAnimation]);

    useEffect(() => {
        if (!enableAnimation) {
            setIsInViewport(false);

            return;
        }

        const element = containerRef.current;

        if (!element) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            setIsInViewport(true);

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsInViewport(Boolean(entry?.isIntersecting));
            },
            { threshold: 0.01 },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [enableAnimation, count, inline, isCentered, direction]);

    const shouldAnimate = enableAnimation && isDocumentVisible && isInViewport;

    const skeletonStyle: CSSProperties = {
        ...style,
        ...(baseColor && { ['--base-color' as string]: baseColor }),
        ...(borderRadius && { ['--skeleton-border-radius' as string]: borderRadius }),
        ...(height !== undefined && {
            height: typeof height === 'number' ? `${height}px` : height,
        }),
        ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
    };

    const containerClasses = clsx(styles.skeletonContainer, containerClassName, {
        [styles.centered]: isCentered,
        [styles.inline]: inline,
        [styles.rtl]: direction === 'rtl',
    });

    const skeletonClasses = clsx(styles.skeleton, className, {
        [styles.animated]: shouldAnimate,
    });

    if (count <= 1) {
        return (
            <div className={containerClasses} ref={containerRef}>
                <div className={skeletonClasses} style={skeletonStyle} />
            </div>
        );
    }

    return (
        <div
            className={clsx(containerClasses, styles.skeletonWrapper)}
            dir={direction}
            ref={containerRef}
        >
            {Array.from({ length: count }, (_, i) => (
                <div className={skeletonClasses} key={i} style={skeletonStyle} />
            ))}
        </div>
    );
}

export const Skeleton = memo(BaseSkeleton);

Skeleton.displayName = 'Skeleton';
