import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import isElectron from 'is-electron';
import throttle from 'lodash/throttle';
import { TbArrowBarLeft } from 'react-icons/tb';
import { Outlet, useLocation } from 'react-router';
import styled from 'styled-components';
import { UserDetailResponse } from '@/renderer/api/users.api';
import { PlayQueue } from '@/renderer/features/now-playing/';
import { Titlebar } from '@/renderer/features/titlebar/components/titlebar';
import { useUserDetail } from '@/renderer/features/users';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, useAuthStore } from '@/renderer/store';
import { useSettingsStore } from '@/renderer/store/settings.store';
import { PlaybackType } from '@/renderer/types';
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
  border-right: var(--sidebar-border);
`;

const RightSidebarContainer = styled(motion.div)`
  position: relative;
  grid-area: right-sidebar;
  background: var(--sidebar-bg);
  border-left: var(--sidebar-border);
`;

const PlayerbarContainer = styled.footer`
  z-index: 100;
  grid-area: player;
  background: var(--playerbar-bg);
  filter: drop-shadow(0 -3px 1px rgba(0, 0, 0, 10%));
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

const QueueDrawer = styled(motion.div)`
  background: var(--sidebar-bg);
  border-left: var(--sidebar-border);
`;

const QueueDrawerButton = styled(motion.div)`
  position: absolute;
  top: 35%;
  right: 25px;
  z-index: 100;
  display: flex;
  align-items: center;
  width: 20px;
  height: 25vh;
  user-select: none;
`;

const SideQueueContainer = styled.div`
  width: 100%;
  height: 100%;

  .ag-root ::-webkit-scrollbar-track-piece {
    background: var(--main-bg);
  }

  .ag-theme-alpine-dark {
    --ag-background-color: var(--sidebar-bg) !important;
    --ag-odd-row-background-color: var(--sidebar-bg) !important;
  }
`;

interface DefaultLayoutProps {
  shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
  const sidebar = useAppStore((state) => state.sidebar);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const [drawer, drawerHandler] = useDisclosure(false);
  const location = useLocation();

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const userId = useAuthStore((state) => state.permissions.id);
  const login = useAuthStore((state) => state.login);
  const setSettings = useSettingsStore((state) => state.setSettings);

  const showQueueDrawerButton =
    !sidebar.rightExpanded &&
    !drawer &&
    location.pathname !== AppRoute.NOW_PLAYING;

  const showSideQueue =
    sidebar.rightExpanded && location.pathname !== AppRoute.NOW_PLAYING;

  const queueDrawerButtonVariants: Variants = {
    hidden: {
      opacity: 0,
      transition: { duration: 0.2 },
      x: 100,
    },
    visible: {
      opacity: 0.5,
      transition: { duration: 0.2, ease: 'anticipate' },
      x: 0,
    },
  };

  const queueDrawerVariants: Variants = {
    closed: {
      height: 'calc(100% - 120px)',
      minWidth: '400px',
      position: 'absolute',
      right: 0,
      transition: {
        duration: 0.3,
        ease: 'anticipate',
      },
      width: '30vw',
      x: '30vw',
    },
    open: {
      height: 'calc(100% - 120px)',
      minWidth: '400px',
      position: 'absolute',
      right: 0,
      transition: {
        damping: 10,
        delay: 0,
        duration: 0.3,
        ease: 'anticipate',
        mass: 0.5,
      },
      width: '30vw',
      x: 0,
      zIndex: 120,
    },
  };

  const queueSidebarVariants: Variants = {
    closed: {
      transition: { duration: 0.5 },
      width: sidebar.rightWidth,
      x: 1000,
      zIndex: 120,
    },
    open: {
      transition: {
        duration: 0.5,
        ease: 'anticipate',
      },
      width: sidebar.rightWidth,
      x: 0,
      zIndex: 120,
    },
  };

  useEffect(() => {
    if (!isElectron()) {
      setSettings({
        player: {
          ...useSettingsStore.getState().player,
          type: PlaybackType.WEB,
        },
      });
    }
  }, [setSettings]);

  // Fetch and cache user profile
  useUserDetail(
    { userId },
    {
      cacheTime: Infinity,
      onSuccess: (res: UserDetailResponse) => {
        const props = {
          permissions: {
            id: res.data.id,
            isAdmin: res.data.isAdmin,
            isSuperAdmin: res.data.isSuperAdmin,
            username: res.data.username,
          },
        };

        login(props);
      },
      staleTime: 1000 * 60 * 60 * 8,
    }
  );

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
    <>
      <Layout>
        <TitlebarContainer>
          <Titlebar />
        </TitlebarContainer>
        <MainContainer
          leftSidebarWidth={sidebar.leftWidth}
          rightExpanded={showSideQueue}
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
              <AnimatePresence exitBeforeEnter initial={false}>
                {showQueueDrawerButton && (
                  <QueueDrawerButton
                    key="queue-drawer-button"
                    animate="visible"
                    exit="hidden"
                    initial="hidden"
                    variants={queueDrawerButtonVariants}
                    onMouseEnter={() => drawerHandler.open()}
                  >
                    <TbArrowBarLeft size={12} />
                  </QueueDrawerButton>
                )}

                {drawer && (
                  <QueueDrawer
                    key="queue-drawer"
                    animate="open"
                    exit="closed"
                    initial="closed"
                    variants={queueDrawerVariants}
                    onMouseLeave={() => {
                      // The drawer will close due to the delay when setting isReorderingQueue
                      setTimeout(() => {
                        if (useAppStore.getState().isReorderingQueue) return;
                        drawerHandler.close();
                      }, 50);
                    }}
                  >
                    <SideQueueContainer>
                      <PlayQueue type="sideDrawerQueue" />
                    </SideQueueContainer>
                  </QueueDrawer>
                )}
              </AnimatePresence>
              <AnimatePresence
                key="queue-sidebar"
                exitBeforeEnter
                presenceAffectsLayout
                initial={false}
              >
                {showSideQueue && (
                  <RightSidebarContainer
                    key="queue-sidebar"
                    animate="open"
                    exit="closed"
                    initial="closed"
                    variants={queueSidebarVariants}
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
                    <SideQueueContainer>
                      <PlayQueue type="sideQueue" />
                    </SideQueueContainer>
                  </RightSidebarContainer>
                )}
              </AnimatePresence>
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
