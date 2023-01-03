import { forwardRef, Ref, useEffect, useRef, useState } from 'react';
import type { ScrollAreaProps as MantineScrollAreaProps } from '@mantine/core';
import { ScrollArea as MantineScrollArea } from '@mantine/core';
import { useMergedRef, useTimeout } from '@mantine/hooks';
import { motion, useScroll } from 'framer-motion';
import styled from 'styled-components';
import { PageHeader, PageHeaderProps } from '/@/renderer/components/page-header';

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
`;

const StyledNativeScrollArea = styled.div`
  height: 100%;
  overflow-y: overlay;

  &::-webkit-scrollbar-track {
    margin-top: 35px;
  }

  &::-webkit-scrollbar-thumb {
    margin-top: 35px;
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
  pageHeaderProps?: PageHeaderProps & { offset?: any; target: any };
}

export const NativeScrollArea = forwardRef(
  (
    { children, pageHeaderProps, debugScrollPosition, ...props }: NativeScrollAreaProps,
    ref: Ref<HTMLDivElement>,
  ) => {
    const [hideScrollbar, setHideScrollbar] = useState(false);
    const [hideHeader, setHideHeader] = useState(true);
    const { start, clear } = useTimeout(() => setHideScrollbar(true), 1000);

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
        <PageHeader
          isHidden={hideHeader}
          position="absolute"
          style={{ opacity: scrollYProgress as any }}
          {...pageHeaderProps}
        />
        <StyledNativeScrollArea
          ref={mergedRef}
          className={hideScrollbar ? 'hide-scrollbar' : undefined}
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
