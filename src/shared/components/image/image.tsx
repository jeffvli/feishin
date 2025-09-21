import clsx from 'clsx';
import { motion, MotionConfigProps } from 'motion/react';
import { ForwardedRef, forwardRef, type ImgHTMLAttributes } from 'react';
import { Img } from 'react-image';
import { InView } from 'react-intersection-observer';

import styles from './image.module.css';

import { animationProps } from '/@/shared/components/animations/animation-props';
import { Icon } from '/@/shared/components/icon/icon';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';

interface ImageContainerProps extends MotionConfigProps {
    children: React.ReactNode;
    className?: string;
    enableAnimation?: boolean;
}

interface ImageLoaderProps {
    className?: string;
}

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    containerClassName?: string;
    enableAnimation?: boolean;
    imageContainerProps?: Omit<ImageContainerProps, 'children'>;
    includeLoader?: boolean;
    includeUnloader?: boolean;
    src: string | string[] | undefined;
    thumbHash?: string;
}

interface ImageUnloaderProps {
    className?: string;
}

const FALLBACK_SVG =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1IiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4=';

export function Image({
    className,
    containerClassName,
    enableAnimation,
    imageContainerProps,
    includeLoader = true,
    includeUnloader = true,
    src,
}: ImageProps) {
    if (src) {
        return (
            <InView>
                {({ inView, ref }) => (
                    <Img
                        className={clsx(styles.image, className)}
                        container={(children) => (
                            <ImageContainer
                                className={containerClassName}
                                enableAnimation={enableAnimation}
                                ref={ref}
                                {...imageContainerProps}
                            >
                                {children}
                            </ImageContainer>
                        )}
                        loader={
                            includeLoader ? (
                                <ImageContainer className={containerClassName}>
                                    <ImageLoader className={className} />
                                </ImageContainer>
                            ) : null
                        }
                        src={inView ? src : FALLBACK_SVG}
                        unloader={
                            includeUnloader ? (
                                <ImageContainer className={containerClassName}>
                                    <ImageUnloader className={className} />
                                </ImageContainer>
                            ) : null
                        }
                    />
                )}
            </InView>
        );
    }

    return <ImageUnloader />;
}

const ImageContainer = forwardRef(
    (
        { children, className, enableAnimation, ...props }: ImageContainerProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        if (!enableAnimation) {
            return (
                <div className={clsx(styles.imageContainer, className)} ref={ref} {...props}>
                    {children}
                </div>
            );
        }

        return (
            <motion.div
                className={clsx(styles.imageContainer, className)}
                ref={ref}
                {...animationProps.fadeIn}
                {...props}
            >
                {children}
            </motion.div>
        );
    },
);

function ImageLoader({ className }: ImageLoaderProps) {
    return (
        <div className={clsx(styles.loader, className)}>
            <Skeleton className={clsx(styles.skeleton, className)} enableAnimation={true} />
        </div>
    );
}

function ImageUnloader({ className }: ImageUnloaderProps) {
    return (
        <div className={clsx(styles.unloader, className)}>
            <Icon color="default" icon="emptyImage" size="xl" />
        </div>
    );
}
