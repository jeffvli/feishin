import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { throttle } from 'lodash';
import { Outlet, useLocation } from 'react-router';
import styled from 'styled-components';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStoreActions, useSidebarStore } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { constrainSidebarWidth, constrainRightSidebarWidth } from '/@/renderer/utils';
import { LeftSidebar } from '/@/renderer/layouts/default-layout/left-sidebar';
import { FullScreenOverlay } from '/@/renderer/layouts/default-layout/full-screen-overlay';
import { RightSidebar } from '/@/renderer/layouts/default-layout/right-sidebar';
import { Spinner } from '/@/renderer/components';

const SideDrawerQueue = lazy(() =>
  import('/@/renderer/layouts/default-layout/side-drawer-queue').then((module) => ({
    default: module.SideDrawerQueue,
  })),
);

const MINIMUM_SIDEBAR_WIDTH = 260;

const MainContentContainer = styled.div<{
  leftSidebarWidth: string;
  rightExpanded?: boolean;
  rightSidebarWidth?: string;
  shell?: boolean;
  sidebarCollapsed?: boolean;
}>`
  position: relative;
  display: ${(props) => (props.shell ? 'flex' : 'grid')};
  grid-area: main-content;
  grid-template-areas: 'sidebar . right-sidebar';
  grid-template-rows: 1fr;
  grid-template-columns: ${(props) => (props.sidebarCollapsed ? '80px' : props.leftSidebarWidth)} 1fr ${(
      props,
    ) => props.rightExpanded && props.rightSidebarWidth};

  gap: 0;
  background: var(--main-bg);
`;

export const MainContent = ({ shell }: { shell?: boolean }) => {
  const location = useLocation();
  const { collapsed, leftWidth, rightWidth, rightExpanded } = useSidebarStore();
  const { setSideBar } = useAppStoreActions();
  const { sideQueueType } = useGeneralSettings();
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const { showQueueDrawerButton } = useGeneralSettings();

  const showSideQueue = rightExpanded && location.pathname !== AppRoute.NOW_PLAYING;
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);

  const startResizing = useCallback((position: 'left' | 'right') => {
    if (position === 'left') return setIsResizing(true);
    return setIsResizingRight(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    setIsResizingRight(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: any) => {
      if (isResizing) {
        const width = mouseMoveEvent.clientX;
        const constrainedWidth = `${constrainSidebarWidth(width)}px`;

        if (width < MINIMUM_SIDEBAR_WIDTH - 100) {
          setSideBar({ collapsed: true });
        } else {
          setSideBar({ collapsed: false, leftWidth: constrainedWidth });
        }
      } else if (isResizingRight) {
        const start = Number(rightWidth.split('px')[0]);
        const { left } = rightSidebarRef!.current!.getBoundingClientRect();
        const width = `${constrainRightSidebarWidth(start + left - mouseMoveEvent.clientX)}px`;
        setSideBar({ rightWidth: width });
      }
    },
    [isResizing, isResizingRight, setSideBar, rightWidth],
  );

  const throttledResize = useMemo(() => throttle(resize, 50), [resize]);

  useEffect(() => {
    window.addEventListener('mousemove', throttledResize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', throttledResize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [throttledResize, stopResizing]);

  return (
    <MainContentContainer
      id="main-content"
      leftSidebarWidth={leftWidth}
      rightExpanded={showSideQueue && sideQueueType === 'sideQueue'}
      rightSidebarWidth={rightWidth}
      shell={shell}
      sidebarCollapsed={collapsed}
    >
      {!shell && (
        <>
          <Suspense fallback={<></>}>{showQueueDrawerButton && <SideDrawerQueue />}</Suspense>
          <FullScreenOverlay />
          <LeftSidebar
            isResizing={isResizing}
            startResizing={startResizing}
          />
          <RightSidebar
            ref={rightSidebarRef}
            isResizing={isResizingRight}
            startResizing={startResizing}
          />
        </>
      )}
      <Suspense fallback={<Spinner container />}>
        <Outlet />
      </Suspense>
    </MainContentContainer>
  );
};
