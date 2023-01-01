import { Flex, FlexProps } from '@mantine/core';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useShouldPadTitlebar } from '/@/renderer/hooks';

const Container = styled(motion(Flex))<{ $isHidden?: boolean; height?: string; position?: string }>`
  position: ${(props) => props.position || 'relative'};
  z-index: 2000;
  width: 100%;
  height: ${(props) => props.height || '60px'};
  opacity: ${(props) => (props.$isHidden ? 0 : 1)};
  transition: opacity 0.3s ease-in-out;
  user-select: ${(props) => (props.$isHidden ? 'none' : 'auto')};
  pointer-events: ${(props) => (props.$isHidden ? 'none' : 'auto')};
`;

const Header = styled(motion.div)<{ $padRight?: boolean }>`
  position: relative;
  z-index: 15;
  width: 100%;
  height: 100%;
  margin-right: ${(props) => props.$padRight && '170px'};
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

const BackgroundImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 30%), var(--background-noise);
`;

interface PageHeaderProps
  extends Omit<FlexProps, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  backgroundColor?: string;
  children?: React.ReactNode;
  height?: string;
  isHidden?: boolean;
  position?: string;
}

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

  useEffect(() => {
    const rootElement = document.querySelector(':root') as HTMLElement;
    rootElement?.style?.setProperty('--header-opacity', '0');
  }, []);

  return (
    <Container
      ref={ref}
      $isHidden={isHidden}
      height={height}
      position={position}
      {...props}
    >
      <Header $padRight={padRight}>{!isHidden && <>{children}</>}</Header>
      {backgroundColor && (
        <>
          <BackgroundImage background={'var(--titlebar-bg)' || ''} />
          <BackgroundImageOverlay />
        </>
      )}
    </Container>
  );
};
