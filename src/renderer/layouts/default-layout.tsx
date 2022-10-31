import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router';
import { SideQueue } from '@/renderer/features/side-queue/components/side-queue';
import { Titlebar } from '@/renderer/features/titlebar/components/titlebar';
import { useAppStore } from '@/renderer/store';
import {
  constrainRightSidebarWidth,
  constrainSidebarWidth,
} from '@/renderer/utils';
import { Playerbar } from '../features/player';
import { Sidebar } from '../features/sidebar/components/sidebar';

const Layout = styled.div`
  display: grid;
  grid-template-areas:
    'header'
    'main'
    'player';
  grid-template-rows: 30px 1fr 90px;
  grid-template-columns: 1fr;
  gap: 0;
  height: 100%;
`;

const TitlebarContainer = styled.header`
  grid-area: header;
  background: var(--titlebar-bg);
  -webkit-app-region: drag;
`;

const MainContainer = styled.main<{
  leftSidebarWidth: string;
  rightExpanded?: boolean;
  rightSidebarWidth?: string;
}>`
  display: grid;
  grid-area: main;
  grid-template-areas: 'sidebar . right-sidebar';
  grid-template-rows: 1fr;
  grid-template-columns: ${(props) => props.leftSidebarWidth} 1fr ${(props) =>
      props.rightExpanded && props.rightSidebarWidth};
  gap: 0;
  background: var(--main-bg);
`;

const SidebarContainer = styled.div`
  position: relative;
  grid-area: sidebar;
  background: var(--sidebar-bg);
`;

const RightSidebarContainer = styled(motion.div)`
  position: relative;
  grid-area: right-sidebar;
  background: var(--sidebar-bg);
`;

const PlayerbarContainer = styled.footer`
  z-index: 50;
  grid-area: player;
  background: var(--playerbar-bg);
`;

const ResizeHandle = styled.div<{
  isResizing: boolean;
  placement: 'top' | 'left' | 'bottom' | 'right';
}>`
  position: absolute;
  top: ${(props) => props.placement === 'top' && 0};
  right: ${(props) => props.placement === 'right' && 0};
  bottom: ${(props) => props.placement === 'bottom' && 0};
  left: ${(props) => props.placement === 'left' && 0};
  z-index: 100;
  width: 2px;
  height: 100%;
  background-color: var(--sidebar-handle-bg);
  cursor: ew-resize;
  opacity: ${(props) => (props.isResizing ? 1 : 0)};

  &:hover {
    opacity: 0.5;
  }
`;

interface DefaultLayoutProps {
  shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
  const sidebar = useAppStore((state) => state.sidebar);
  const setSidebar = useAppStore((state) => state.setSidebar);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizing = useCallback((position: 'left' | 'right') => {
    if (position === 'left') return setIsResizing(true);
    return setIsResizingRight(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    setIsResizingRight(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const width = `${constrainSidebarWidth(mouseMoveEvent.clientX)}px`;
        setSidebar({ leftWidth: width });
      }
      if (isResizingRight) {
        const start = Number(sidebar.rightWidth.split('px')[0]);
        const { left } = rightSidebarRef!.current!.getBoundingClientRect();
        const width = `${constrainRightSidebarWidth(
          start + left - mouseMoveEvent.clientX
        )}px`;
        setSidebar({ rightWidth: width });
      }
    },
    [isResizing, isResizingRight, setSidebar, sidebar.rightWidth]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <>
      <Layout>
        <TitlebarContainer>
          <Titlebar />
        </TitlebarContainer>
        <MainContainer
          leftSidebarWidth={sidebar.leftWidth}
          rightExpanded={sidebar.rightExpanded}
          rightSidebarWidth={sidebar.rightWidth}
        >
          {!shell && (
            <>
              <SidebarContainer>
                <ResizeHandle
                  ref={sidebarRef}
                  isResizing={isResizing}
                  placement="right"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    startResizing('left');
                  }}
                />
                <Sidebar />
              </SidebarContainer>
              {sidebar.rightExpanded && (
                <RightSidebarContainer
                  key="sb"
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  initial={{ opacity: 0, x: 500 }}
                  transition={{ duration: 0.3, ease: 'circOut' }}
                >
                  <ResizeHandle
                    ref={rightSidebarRef}
                    isResizing={isResizingRight}
                    placement="left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startResizing('right');
                    }}
                  />
                  <SideQueue />
                </RightSidebarContainer>
              )}
            </>
          )}

          <Outlet />
        </MainContainer>
        <PlayerbarContainer>
          <Playerbar />
        </PlayerbarContainer>
      </Layout>
    </>
  );
};

DefaultLayout.defaultProps = {
  shell: false,
};
