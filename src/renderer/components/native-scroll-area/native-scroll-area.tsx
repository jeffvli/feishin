import { useMergedRef } from '@mantine/hooks';
import { useInView } from 'motion/react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { CSSProperties, forwardRef, ReactNode, Ref, useEffect, useRef, useState } from 'react';

import styles from './native-scroll-area.module.css';

import { PageHeader, PageHeaderProps } from '/@/renderer/components/page-header/page-header';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/shared/types/types';

interface NativeScrollAreaProps {
    children: ReactNode;
    debugScrollPosition?: boolean;
    noHeader?: boolean;
    pageHeaderProps?: PageHeaderProps & { offset: number; target?: any };
    scrollBarOffset?: string;
    scrollHideDelay?: number;
    style?: CSSProperties;
}

export const NativeScrollArea = forwardRef(
    (
        { children, noHeader, pageHeaderProps, scrollHideDelay, ...props }: NativeScrollAreaProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { windowBarStyle } = useWindowSettings();
        const containerRef = useRef(null);
        const [isPastOffset, setIsPastOffset] = useState(false);

        const isInView = useInView({
            current: pageHeaderProps?.target?.current,
        });

        const [initialize] = useOverlayScrollbars({
            defer: false,
            events: {
                scroll: (_instance, e) => {
                    if (noHeader) {
                        return setIsPastOffset(true);
                    }

                    if (pageHeaderProps?.target || !pageHeaderProps?.offset) {
                        return setIsPastOffset(true);
                    }

                    const offset = pageHeaderProps?.offset;
                    const scrollTop = (e?.target as HTMLDivElement)?.scrollTop;

                    if (scrollTop > offset && isPastOffset === false) {
                        return setIsPastOffset(true);
                    }

                    if (scrollTop <= offset && isPastOffset === true) {
                        return setIsPastOffset(false);
                    }

                    return null;
                },
            },
            options: {
                overflow: { x: 'hidden', y: 'scroll' },
                scrollbars: {
                    autoHide: 'leave',
                    autoHideDelay: scrollHideDelay || 500,
                    pointers: ['mouse', 'pen', 'touch'],
                    theme: 'feishin-os-scrollbar',
                    visibility: 'visible',
                },
            },
        });

        useEffect(() => {
            if (containerRef.current) {
                initialize(containerRef.current as HTMLDivElement);
            }
        }, [initialize]);

        const mergedRef = useMergedRef(ref, containerRef);

        const shouldShowHeader = !noHeader && isPastOffset && !isInView;

        return (
            <>
                {windowBarStyle === Platform.WEB && <div className={styles.dragContainer} />}
                {shouldShowHeader && (
                    <PageHeader
                        animated
                        isHidden={false}
                        position="absolute"
                        {...pageHeaderProps}
                    />
                )}
                <div
                    className={styles.scrollArea}
                    ref={mergedRef}
                    {...props}
                >
                    {children}
                </div>
            </>
        );
    },
);
