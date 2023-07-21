import type { ScrollAreaProps as MantineScrollAreaProps } from '@mantine/core';
import { ScrollArea as MantineScrollArea } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { useInView } from 'framer-motion';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { forwardRef, Ref, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { PageHeader, PageHeaderProps } from '/@/renderer/components/page-header';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

interface ScrollAreaProps extends MantineScrollAreaProps {
    children: React.ReactNode;
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

const StyledNativeScrollArea = styled.div<{ scrollBarOffset?: string; windowBarStyle?: Platform }>`
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
    children: React.ReactNode;
    debugScrollPosition?: boolean;
    noHeader?: boolean;
    pageHeaderProps?: PageHeaderProps & { offset?: any; target?: any };
    scrollBarOffset?: string;
    scrollHideDelay?: number;
    style?: React.CSSProperties;
}

export const NativeScrollArea = forwardRef(
    (
        {
            children,
            pageHeaderProps,
            debugScrollPosition,
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

        // useInView initializes as false, so we need to track this to properly render the header
        const isInViewInitializedRef = useRef<boolean | null>(null);

        const isInView = useInView({
            current: pageHeaderProps?.target?.current,
        });

        useEffect(() => {
            if (!isInViewInitializedRef.current && isInView) {
                isInViewInitializedRef.current = true;
            }
        }, [isInView]);

        const [initialize] = useOverlayScrollbars({
            defer: true,

            events: {
                scroll: (_instance, e) => {
                    if (!pageHeaderProps?.offset) {
                        return;
                    }

                    const offset = pageHeaderProps?.offset;
                    const scrollTop = (e?.target as HTMLDivElement)?.scrollTop;

                    if (scrollTop > offset && isPastOffset === false) {
                        setIsPastOffset(true);
                    } else if (scrollTop <= offset && isPastOffset === true) {
                        setIsPastOffset(false);
                    }
                },
            },
            options: {
                overflow: { x: 'hidden', y: 'scroll' },
                scrollbars: {
                    autoHide: 'move',
                    autoHideDelay: 500,
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

        // console.log('isPastOffsetRef.current', isPastOffsetRef.current);

        const mergedRef = useMergedRef(ref, containerRef);

        const shouldShowHeader =
            !noHeader && (isPastOffset || (isInViewInitializedRef.current && !isInView));

        return (
            <>
                {shouldShowHeader && (
                    <PageHeader
                        animated
                        isHidden={false}
                        position="absolute"
                        {...pageHeaderProps}
                    />
                )}
                <StyledNativeScrollArea
                    ref={mergedRef}
                    scrollBarOffset={scrollBarOffset}
                    windowBarStyle={windowBarStyle}
                    {...props}
                >
                    {children}
                </StyledNativeScrollArea>
            </>
        );
    },
);
