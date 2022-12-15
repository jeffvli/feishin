import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useShouldPadTitlebar } from '/@/hooks';

const Container = styled(motion.div)<{ $useOpacity?: boolean; height?: string }>`
  z-index: 100;
  width: 100%;
  height: ${(props) => props.height || '55px'};
  opacity: ${(props) => props.$useOpacity && 'var(--header-opacity)'};
  transition: opacity 0.3s ease-in-out;
`;

const Header = styled(motion.div)<{ $padRight?: boolean }>`
  height: 100%;
  margin-right: ${(props) => props.$padRight && '170px'};
  padding: 1rem;
  -webkit-app-region: drag;

  button {
    -webkit-app-region: no-drag;
  }
`;

interface PageHeaderProps {
  backgroundColor?: string;
  children?: React.ReactNode;
  height?: string;
  useOpacity?: boolean;
}

export const PageHeader = ({ height, backgroundColor, useOpacity, children }: PageHeaderProps) => {
  const ref = useRef(null);
  const padRight = useShouldPadTitlebar();

  useEffect(() => {
    const rootElement = document.querySelector(':root') as HTMLElement;
    rootElement?.style?.setProperty('--header-opacity', '0');
  }, []);

  return (
    <Container
      ref={ref}
      $useOpacity={useOpacity}
      animate={{
        backgroundColor,
        transition: { duration: 1.5 },
      }}
      height={height}
    >
      <Header $padRight={padRight}>{children}</Header>
    </Container>
  );
};
