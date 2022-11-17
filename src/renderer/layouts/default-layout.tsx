import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import isElectron from 'is-electron';
import throttle from 'lodash/throttle';
import { TbArrowBarLeft } from 'react-icons/tb';
import { Outlet } from 'react-router';
import styled from 'styled-components';
import { UserDetailResponse } from '@/renderer/api/users.api';
import { SideQueue } from '@/renderer/features/side-queue/components/side-queue';
import { Titlebar } from '@/renderer/features/titlebar/components/titlebar';
import { useUserDetail } from '@/renderer/features/users';
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
  right: 0;
  z-index: 55;
  display: flex;
  align-items: center;
  width: 50px;
  height: 25vh;
  opacity: 0.3;
  user-select: none;
`;

interface DefaultLayoutProps {
  shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
  const sidebar = useAppStore((state) => state.sidebar);
  const setSidebar = useAppStore((state) => state.setSidebar);
  const [opened, drawerHandler] = useDisclosure(false);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const userId = useAuthStore((state) => state.permissions.id);
  const login = useAuthStore((state) => state.login);
  const setSettings = useSettingsStore((state) => state.setSettings);

  const queueDrawerVariants: Variants = {
    closed: {
      height: 'calc(100% - 120px)',
      position: 'absolute',
      right: 0,
      width: 0,
    },
    open: {
      height: 'calc(100% - 120px)',
      position: 'absolute',
      right: 0,
      transition: {
        duration: 0.5,
        ease: 'anticipate',
      },
      width: '30vw',
      zIndex: 75,
    },
  };

  const queueSidebarVariants: Variants = {
    closed: {
      transition: { duration: 0.5 },
      x: 1000,
    },
    open: {
      transition: {
        duration: 0.5,
        ease: 'anticipate',
      },
      width: sidebar.rightWidth,
      x: 0,
      zIndex: 75,
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
              {!sidebar.rightExpanded && (
                <QueueDrawerButton
                  whileHover={{ opacity: 0, transition: { duration: 0.2 } }}
                  onMouseEnter={() => drawerHandler.open()}
                >
                  <TbArrowBarLeft size={20} />
                </QueueDrawerButton>
              )}
              <AnimatePresence key="queue-drawer" initial={false}>
                {opened && (
                  <QueueDrawer
                    key="queue-drawer"
                    animate="open"
                    exit="closed"
                    initial="closed"
                    variants={queueDrawerVariants}
                    onMouseLeave={() => drawerHandler.close()}
                  >
                    <SideQueue />
                  </QueueDrawer>
                )}
              </AnimatePresence>
              <AnimatePresence key="queue-sidebar" initial={false}>
                {sidebar.rightExpanded && (
                  <RightSidebarContainer
                    key="queue-sidebar"
                    animate="open"
                    exit="closed"
                    initial="oclosed"
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
                    <SideQueue />
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
