import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Menu, Button } from '@mantine/core';
import { Outlet } from 'react-router';
import { Titlebar } from '@/renderer/features/titlebar';
import { constrainSidebarWidth } from '@/renderer/utils';
import { Playerbar } from '../features/player';
import { Sidebar } from '../features/sidebar';

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

const MainContainer = styled.main<{ leftSidebarWidth: string }>`
  display: grid;
  grid-area: main;
  grid-template-areas: 'sidebar .';
  grid-template-rows: 1fr;
  grid-template-columns: ${(props) => props.leftSidebarWidth} 1fr;
  gap: 0;
  background: var(--main-bg);
`;

const SidebarContainer = styled.div`
  position: relative;
  grid-area: sidebar;
  background: var(--sidebar-bg);
`;

const PlayerbarContainer = styled.footer`
  grid-area: player;
  background: var(--playerbar-bg);
`;

const ResizeHandle = styled.div<{
  isResizing: boolean;
  placement: 'top' | 'left' | 'bottom' | 'right';
}>`
  position: absolute;
  width: 3px;
  height: 100%;
  right: 0;
  background-color: var(--sidebar-handle-bg);
  /* border-top: ${({ placement }) =>
    placement === 'top' && '1px var(--sidebar-handle-bg) solid'};
  border-right: ${({ placement }) =>
    placement === 'right' && '1px var(--sidebar-handle-bg) solid'};
  border-bottom: ${({ placement }) =>
    placement === 'bottom' && '1px var(--sidebar-handle-bg) solid'};
  border-left: ${({ placement }) =>
    placement === 'left' && '1px var(--sidebar-handle-bg) solid'}; */
  opacity: ${(props) => (props.isResizing ? 1 : 0)};
  cursor: ew-resize;

  &:hover {
    opacity: 1;
  }
`;

export const DefaultLayout = () => {
  const [leftSidebarWidth, setLeftSidebarWidth] = useState('170px');

  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        setLeftSidebarWidth(
          `${constrainSidebarWidth(mouseMoveEvent.clientX)}px`
        );
      }
    },
    [isResizing]
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
      {/* <LayoutContainer>
        <TitlebarContainer size={30}>
          <Titlebar />
        </TitlebarContainer>
        <Space.Fill>
          <LeftSidebar
            handleRender={(props) => (
              <ResizeHandle placement="right" {...props} />
            )}
            maximumSize={400}
            minimumSize={175}
            size={175}
          >
            <Sidebar />
          </LeftSidebar>
          <RightSidebar
            scrollable
            handleRender={(props) => (
              <ResizeHandle placement="left" {...props} />
            )}
            maximumSize={800}
            size={300}
          >
            <QueueTable />
          </RightSidebar>
          <Space.Fill scrollable>
            <AnimatePresence exitBeforeEnter>
              <ContentContainer key={location.pathname}>
                <Outlet />
              </ContentContainer>
            </AnimatePresence>
          </Space.Fill>
        </Space.Fill>
        <PlayerbarContainer size={90}>
          <Playerbar />
        </PlayerbarContainer>
      </LayoutContainer> */}
      <Layout>
        <TitlebarContainer>
          <Titlebar />
          <Menu withinPortal zIndex="999999">
            <Menu.Target>
              <Button />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item>Hello</Menu.Item>
              <Menu.Item>Hello</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </TitlebarContainer>
        <MainContainer leftSidebarWidth={leftSidebarWidth}>
          <SidebarContainer>
            <ResizeHandle
              ref={sidebarRef}
              isResizing={isResizing}
              placement="left"
              onMouseDown={(e) => {
                e.preventDefault();
                startResizing();
              }}
            />
            <Sidebar />
          </SidebarContainer>
          <Outlet />
        </MainContainer>
        <PlayerbarContainer>
          <Playerbar />
        </PlayerbarContainer>
      </Layout>
    </>
  );
};
