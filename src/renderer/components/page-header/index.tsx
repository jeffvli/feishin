import { Flex, FlexProps } from '@mantine/core';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { useRef } from 'react';
import styled from 'styled-components';
import { useShouldPadTitlebar, useTheme } from '/@/renderer/hooks';

const Container = styled(motion(Flex))<{
  height?: string;
  position?: string;
}>`
  position: ${(props) => props.position || 'relative'};
  z-index: 2000;
  width: 100%;
  height: ${(props) => props.height || '60px'};
`;

const Header = styled(motion.div)<{ $isHidden?: boolean; $padRight?: boolean }>`
  position: relative;
  z-index: 15;
  width: 100%;
  height: 100%;
  margin-right: ${(props) => props.$padRight && '170px'};
  user-select: ${(props) => (props.$isHidden ? 'none' : 'auto')};
  pointer-events: ${(props) => (props.$isHidden ? 'none' : 'auto')};
  -webkit-app-region: drag;

  button {
    -webkit-app-region: no-drag;
  }

  input {
    -webkit-app-region: no-drag;
  }
`;

const BackgroundImage = styled.div<{ background: string }>`
  position: absolute;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: ${(props) => props.background || 'var(--titlebar-bg)'};
`;

const BackgroundImageOverlay = styled.div<{ theme: 'light' | 'dark' }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  background: ${(props) =>
    props.theme === 'light'
      ? 'linear-gradient(rgba(0, 0, 0, 20%), rgba(0, 0, 0, 20%))'
      : 'linear-gradient(rgba(0, 0, 0, 50%), rgba(0, 0, 0, 50%))'};
`;

export interface PageHeaderProps
  extends Omit<FlexProps, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  backgroundColor?: string;
  children?: React.ReactNode;
  height?: string;
  isHidden?: boolean;
  position?: string;
}

const TitleWrapper = styled(motion.div)`
  width: 100%;
  height: 100%;
`;

const variants: Variants = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
};

export const PageHeader = ({
  position,
  height,
  backgroundColor,
  isHidden,
  children,
  ...props
}: PageHeaderProps) => {
  const ref = useRef(null);
  const padRight = useShouldPadTitlebar();
  const theme = useTheme();

  return (
    <Container
      ref={ref}
      height={height}
      position={position}
      {...props}
    >
      <Header
        $isHidden={isHidden}
        $padRight={padRight}
      >
        <AnimatePresence>
          {!isHidden && (
            <TitleWrapper
              animate="animate"
              exit="exit"
              initial="initial"
              variants={variants}
            >
              {children}
            </TitleWrapper>
          )}
        </AnimatePresence>
      </Header>
      {backgroundColor && (
        <>
          <BackgroundImage background={backgroundColor || 'var(--titlebar-bg)'} />
          <BackgroundImageOverlay theme={theme} />
        </>
      )}
    </Container>
  );
};
