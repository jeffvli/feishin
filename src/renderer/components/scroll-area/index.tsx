import { forwardRef, Ref, useEffect, useRef, useState } from 'react';
import type { ScrollAreaProps as MantineScrollAreaProps } from '@mantine/core';
import { ScrollArea as MantineScrollArea } from '@mantine/core';
import { useMergedRef, useTimeout } from '@mantine/hooks';
import { motion, useScroll } from 'framer-motion';
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
  overflow-y: overlay !important;

  &::-webkit-scrollbar-track {
    margin-top: ${(props) =>
      props.windowBarStyle === Platform.WINDOWS ||
      props.windowBarStyle === Platform.MACOS ||
      props.windowBarStyle === Platform.LINUX
        ? '0px'
        : props.scrollBarOffset || '65px'};
  }

  &::-webkit-scrollbar-thumb {
    margin-top: ${(props) =>
      props.windowBarStyle === Platform.WINDOWS ||
      props.windowBarStyle === Platform.MACOS ||
      props.windowBarStyle === Platform.LINUX
        ? '0px'
        : props.scrollBarOffset || '65px'};
  }
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
    const [hideScrollbar, setHideScrollbar] = useState(false);
    const [hideHeader, setHideHeader] = useState(true);
    const { start, clear } = useTimeout(
      () => setHideScrollbar(true),
      scrollHideDelay !== undefined ? scrollHideDelay * 1000 : 0,
    );

    const containerRef = useRef(null);
    const mergedRef = useMergedRef(ref, containerRef);

    const { scrollYProgress } = useScroll({
      container: containerRef,
      offset: pageHeaderProps?.offset || ['center start', 'end start'],
      target: pageHeaderProps?.target,
    });

    // Automatically hide the scrollbar after the timeout duration
    useEffect(() => {
      start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const setHeaderVisibility = (v: number) => {
        if (v === 1) {
          return setHideHeader(false);
        }

        if (hideHeader === false) {
          return setHideHeader(true);
        }

        return undefined;
      };

      const unsubscribe = scrollYProgress.on('change', setHeaderVisibility);

      return () => {
        unsubscribe();
      };
    }, [hideHeader, scrollYProgress]);

    return (
      <>
        {!noHeader && (
          <PageHeader
            isHidden={hideHeader}
            position="absolute"
            style={{ opacity: scrollYProgress as any }}
            {...pageHeaderProps}
          />
        )}
        <StyledNativeScrollArea
          ref={mergedRef}
          className={hideScrollbar ? 'hide-scrollbar' : undefined}
          scrollBarOffset={scrollBarOffset}
          windowBarStyle={windowBarStyle}
          onMouseEnter={() => {
            setHideScrollbar(false);
            clear();
          }}
          onMouseLeave={() => {
            start();
          }}
          {...props}
        >
          {children}
        </StyledNativeScrollArea>
        {debugScrollPosition && (
          <motion.div
            style={{
              background: 'red',
              height: '10px',
              left: 0,
              position: 'fixed',
              right: 0,
              scaleX: scrollYProgress,
              top: 0,
              transformOrigin: '0%',
              width: '100%',
              zIndex: 5000,
            }}
          />
        )}
      </>
    );
  },
);
