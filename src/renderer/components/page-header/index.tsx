import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useShouldPadTitlebar } from '/@/renderer/hooks';

const Container = styled(motion.div)<{ $useOpacity?: boolean; height?: string; position?: string }>`
  position: ${(props) => props.position};
  z-index: 100;
  width: 100%;
  height: ${(props) => props.height || '60px'};
  opacity: ${(props) => props.$useOpacity && 'var(--header-opacity)'};
  transition: opacity 0.3s ease-in-out;
`;

const Header = styled(motion.div)<{ $padRight?: boolean }>`
  z-index: 15;
  height: 100%;
  margin-right: ${(props) => props.$padRight && '170px'};
  padding: 1rem;
  -webkit-app-region: drag;

  button {
    -webkit-app-region: no-drag;
  }

  input {
    -webkit-app-region: no-drag;
  }
`;

// const BackgroundImage = styled.div<{ background: string }>`
//   position: absolute;
//   top: 0;
//   z-index: -1;
//   width: 100%;
//   height: 100%;
//   background: ${(props) => props.background};
// `;

// const BackgroundImageOverlay = styled.div`
//   position: absolute;
//   top: 0;
//   left: 0;
//   z-index: -1;
//   width: 100%;
//   height: 100%;
//   /* background: linear-gradient(180deg, rgba(25, 26, 28, 0%), var(--main-bg)); */
//   /* background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1IiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4='); */
// `;

interface PageHeaderProps {
  backgroundColor?: string;
  children?: React.ReactNode;
  height?: string;
  position?: string;
  useOpacity?: boolean;
}

export const PageHeader = ({
  position,
  height,
  backgroundColor,
  useOpacity,
  children,
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
      $useOpacity={useOpacity}
      animate={{
        backgroundColor,
        transition: { duration: 1.5 },
      }}
      height={height}
      position={position}
    >
      <Header $padRight={padRight}>{children}</Header>
      {/* <BackgroundImage background={backgroundColor} /> */}
      {/* <BackgroundImageOverlay /> */}
    </Container>
  );
};
