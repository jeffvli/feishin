import type { ScrollAreaProps as MantineScrollAreaProps } from '@mantine/core';
import { ScrollArea as MantineScrollArea } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { useInView } from 'framer-motion';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { CSSProperties, forwardRef, ReactNode, Ref, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { PageHeader, PageHeaderProps } from '/@/renderer/components/page-header';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

interface ScrollAreaProps extends MantineScrollAreaProps {
    children: ReactNode;
}

const StyledScrollArea = styled(MantineScrollArea)`
    & .mantine-ScrollArea-thumb {
        background: var(--scrollbar-thumb-bg);
        border-radius: 0;
    }

    & .mantine-ScrollArea-scrollbar {
        padding: 0;
        background: var(--scrollbar-track-bg);
    }

    & .mantine-ScrollArea-viewport > div {
        display: block !important;
    }
`;

const StyledNativeScrollArea = styled.div<{
    $scrollBarOffset?: string;
    $windowBarStyle?: Platform;
}>`
    height: 100%;
`;

export const ScrollArea = forwardRef(({ children, ...props }: ScrollAreaProps, ref: Ref<any>) => {
    return (
        <StyledScrollArea
            ref={ref}
            scrollbarSize={12}
            {...props}
        >
            {children}
        </StyledScrollArea>
    );
});

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
        {
            children,
            pageHeaderProps,
            scrollBarOffset,
            scrollHideDelay,
            noHeader,
            ...props
        }: NativeScrollAreaProps,
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
                    theme: 'feishin',
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
                <PageHeader
                    animated
                    isHidden={!shouldShowHeader}
                    position="absolute"
                    {...pageHeaderProps}
                />
                <StyledNativeScrollArea
                    ref={mergedRef}
                    $scrollBarOffset={scrollBarOffset}
                    $windowBarStyle={windowBarStyle}
                    {...props}
                >
                    {children}
                </StyledNativeScrollArea>
            </>
        );
    },
);
