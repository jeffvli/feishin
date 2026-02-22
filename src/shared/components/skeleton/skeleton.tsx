import clsx from 'clsx';
import { type CSSProperties, memo } from 'react';

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
    enableAnimation = false,
    height,
    inline,
    isCentered,
    style,
    width,
}: SkeletonProps) {
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
        [styles.animated]: enableAnimation,
    });

    if (count <= 1) {
        return (
            <div className={containerClasses}>
                <div className={skeletonClasses} style={skeletonStyle} />
            </div>
        );
    }

    return (
        <div className={clsx(containerClasses, styles.skeletonWrapper)} dir={direction}>
            {Array.from({ length: count }, (_, i) => (
                <div className={skeletonClasses} key={i} style={skeletonStyle} />
            ))}
        </div>
    );
}

export const Skeleton = memo(BaseSkeleton);

Skeleton.displayName = 'Skeleton';
