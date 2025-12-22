import clsx from 'clsx';
import {
    ForwardedRef,
    forwardRef,
    HTMLAttributes,
    type ImgHTMLAttributes,
    memo,
    ReactNode,
} from 'react';
import { Img } from 'react-image';

import styles from './image.module.css';

import { Icon } from '/@/shared/components/icon/icon';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { useInViewport } from '/@/shared/hooks/use-in-viewport';

interface ImageContainerProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
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

export const FALLBACK_SVG =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1IiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4=';

export function BaseImage({
    className,
    containerClassName,
    enableAnimation = false,
    imageContainerProps,
    includeLoader = true,
    includeUnloader = true,
    src,
    ...props
}: ImageProps) {
    const { inViewport, ref } = useInViewport();

    if (src) {
        return (
            <Img
                className={clsx(styles.image, className, {
                    [styles.animated]: enableAnimation,
                })}
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
                decoding="async"
                fetchPriority={inViewport ? 'high' : 'low'}
                loader={
                    includeLoader ? (
                        <ImageContainer className={containerClassName}>
                            <ImageLoader className={className} />
                        </ImageContainer>
                    ) : null
                }
                loading={inViewport ? 'eager' : 'lazy'}
                src={inViewport ? src : FALLBACK_SVG}
                unloader={
                    includeUnloader ? (
                        <ImageContainer className={containerClassName}>
                            <ImageUnloader className={className} />
                        </ImageContainer>
                    ) : null
                }
                {...props}
            />
        );
    }

    return (
        <ImageContainer className={containerClassName}>
            <ImageUnloader />
        </ImageContainer>
    );
}

export const Image = memo(BaseImage);

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
            <div className={clsx(styles.imageContainer, className)} ref={ref} {...props}>
                {children}
            </div>
        );
    },
);

export function ImageLoader({ className }: ImageLoaderProps) {
    return (
        <Skeleton
            className={clsx(styles.skeleton, styles.loader, className)}
            containerClassName={styles.skeletonContainer}
        />
    );
}

export function ImageUnloader({ className }: ImageUnloaderProps) {
    return (
        <div className={clsx(styles.unloader, className)}>
            <Icon color="default" icon="emptyImage" size="25%" />
        </div>
    );
}
