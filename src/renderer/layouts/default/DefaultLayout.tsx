import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import * as Space from 'react-spaces';
import styled from 'styled-components';
import { Playerbar } from 'renderer/features/player';
import { Sidebar } from 'renderer/features/sidebar';
import { Titlebar } from 'renderer/features/titlebar';

const LayoutContainer = styled(Space.ViewPort)``;

const LeftSidebar = styled(Space.LeftResizable)`
  background: var(--sidebar-bg);
`;

const RightSidebar = styled(Space.RightResizable)`
  background: var(--sidebar-bg);
`;

const TitlebarContainer = styled(Space.Top)`
  position: sticky;
  background: var(--titlebar-bg);
  border-bottom: var(--playerbar-border-top);
`;

const ContentContainer = styled(Space.Fill)`
  padding: 1rem;
`;

const PlayerbarContainer = styled(Space.Bottom)``;

const ResizeHandle = styled.span<{
  placement: 'top' | 'left' | 'bottom' | 'right';
}>`
  position: absolute;
  width: 3px;
  height: 100%;
  border-top: ${({ placement }) =>
    placement === 'top' && '1px var(--sidebar-handle-bg) solid'};
  border-right: ${({ placement }) =>
    placement === 'right' && '1px var(--sidebar-handle-bg) solid'};
  border-bottom: ${({ placement }) =>
    placement === 'bottom' && '1px var(--sidebar-handle-bg) solid'};
  border-left: ${({ placement }) =>
    placement === 'left' && '1px var(--sidebar-handle-bg) solid'};
  opacity: 0;

  &:hover {
    opacity: 1;
  }
`;

export const DefaultLayout = () => {
  const location = useLocation();
  return (
    <>
      <LayoutContainer>
        <TitlebarContainer size={40}>
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
            handleRender={(props) => (
              <ResizeHandle placement="left" {...props} />
            )}
            maximumSize={400}
            size={300}
          />
          <Space.Fill>
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
      </LayoutContainer>
    </>
  );
};
