import type { CSSProperties } from 'react';

import clsx from 'clsx';
import RSkeleton from 'react-loading-skeleton';

import styles from './skeleton.module.css';

import 'react-loading-skeleton/dist/skeleton.css';

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

export function Skeleton({
    baseColor,
    borderRadius,
    className,
    containerClassName,
    count,
    direction,
    enableAnimation = true,
    height,
    inline,
    isCentered,
    style,
    width,
}: SkeletonProps) {
    return (
        <RSkeleton
            baseColor={baseColor}
            borderRadius={borderRadius}
            className={clsx(styles.skeleton, className)}
            containerClassName={clsx(styles.skeletonContainer, containerClassName, {
                [styles.centered]: isCentered,
            })}
            count={count}
            direction={direction}
            enableAnimation={enableAnimation}
            height={height}
            inline={inline}
            style={style}
            width={width}
        />
    );
}
