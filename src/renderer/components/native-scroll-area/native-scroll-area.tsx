import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { CSSProperties, forwardRef, memo, ReactNode, Ref, useEffect, useRef } from 'react';

import styles from './native-scroll-area.module.css';

import { PageHeader, PageHeaderProps } from '/@/renderer/components/page-header/page-header';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
import { useThrottledCallback } from '/@/shared/hooks/use-throttled-callback';
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

const BaseNativeScrollArea = forwardRef(
    (
        { children, noHeader, pageHeaderProps, scrollHideDelay, ...props }: NativeScrollAreaProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { windowBarStyle } = useWindowSettings();
        const containerRef = useRef<HTMLDivElement | null>(null);

        const scrollHandler = useThrottledCallback((e: Event) => {
            if (noHeader || !pageHeaderProps) {
                return;
            }

            const scrollElement = e?.target as HTMLDivElement;
            if (!scrollElement || !containerRef.current) {
                return;
            }

            const offset = pageHeaderProps.offset || 0;
            const scrollTop = scrollElement.scrollTop;

            if (scrollTop > offset) {
                containerRef.current.setAttribute('data-scrolled', 'true');
            } else {
                containerRef.current.setAttribute('data-scrolled', 'false');
            }
        }, 100);

        const [initialize] = useOverlayScrollbars({
            defer: false,
            events: {
                scroll: (_instance, e) => {
                    scrollHandler(e);
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
                if (!noHeader && pageHeaderProps) {
                    containerRef.current.setAttribute('data-scrolled', 'false');
                }
            }
        }, [initialize, noHeader, pageHeaderProps]);

        const mergedRef = useMergedRef(ref, containerRef);

        return (
            <>
                {windowBarStyle === Platform.WEB && <div className={styles.dragContainer} />}
                {!noHeader && pageHeaderProps && (
                    <PageHeader
                        animated
                        position="absolute"
                        scrollContainerRef={containerRef}
                        {...pageHeaderProps}
                    />
                )}
                <div className={styles.scrollArea} ref={mergedRef} {...props}>
                    {children}
                </div>
            </>
        );
    },
);

export const NativeScrollArea = memo(BaseNativeScrollArea);

NativeScrollArea.displayName = 'NativeScrollArea';
