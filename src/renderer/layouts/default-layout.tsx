import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDisclosure, useTimeout } from '@mantine/hooks';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import isElectron from 'is-electron';
import throttle from 'lodash/throttle';
import { TbArrowBarLeft } from 'react-icons/tb';
import { Outlet, useLocation } from 'react-router';
import styled from 'styled-components';
import { DrawerPlayQueue, SidebarPlayQueue } from '/@/renderer/features/now-playing';
import { Playerbar } from '/@/renderer/features/player';
import { Sidebar } from '/@/renderer/features/sidebar/components/sidebar';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStore, useAppStoreActions } from '/@/renderer/store';
import { useSettingsStore, useGeneralSettings } from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/renderer/types';
import { constrainSidebarWidth, constrainRightSidebarWidth } from '/@/renderer/utils';

if (!isElectron()) {
  useSettingsStore.getState().actions.setSettings({
    player: {
      ...useSettingsStore.getState().player,
      type: PlaybackType.WEB,
    },
  });
}

const Layout = styled.div`
  display: grid;
  grid-template-areas:
    'main'
    'player';
  grid-template-rows: calc(100vh - 85px) 85px;
  grid-template-columns: 1fr;
  gap: 0;
  height: 100%;
`;

const MainContainer = styled.main<{
  leftSidebarWidth: string;
  rightExpanded?: boolean;
  rightSidebarWidth?: string;
  shell?: boolean;
}>`
  position: relative;
  display: ${(props) => (props.shell ? 'flex' : 'grid')};
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
  height: 100%;
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

const QueueDrawerArea = styled(motion.div)`
  position: absolute;
  top: 50%;
  right: 25px;
  z-index: 100;
  display: flex;
  align-items: center;
  width: 20px;
  height: 30px;
  user-select: none;
`;

interface DefaultLayoutProps {
  shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
  const sidebar = useAppStore((state) => state.sidebar);
  const { setSidebar } = useAppStoreActions();
  const [drawer, drawerHandler] = useDisclosure(false);
  const location = useLocation();
  const { sideQueueType, showQueueDrawerButton } = useGeneralSettings();

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const drawerTimeout = useTimeout(() => drawerHandler.open(), 500);

  const handleEnterDrawerButton = useCallback(() => {
    drawerTimeout.start();
  }, [drawerTimeout]);

  const handleLeaveDrawerButton = useCallback(() => {
    drawerTimeout.clear();
  }, [drawerTimeout]);

  const isQueueDrawerButtonVisible =
    showQueueDrawerButton &&
    !sidebar.rightExpanded &&
    !drawer &&
    location.pathname !== AppRoute.NOW_PLAYING;

  const showSideQueue = sidebar.rightExpanded && location.pathname !== AppRoute.NOW_PLAYING;

  const queueDrawerButtonVariants: Variants = {
    hidden: {
      opacity: 0,
      transition: { duration: 0.2 },
      x: 100,
    },
    visible: {
      opacity: 0.5,
      transition: { duration: 0.1, ease: 'anticipate' },
      x: 0,
    },
  };

  const queueDrawerVariants: Variants = {
    closed: {
      height: 'calc(100vh - 170px)',
      maxWidth: '600px',
      minWidth: '400px',
      position: 'absolute',
      right: 0,
      top: '75px',
      transition: {
        duration: 0.4,
        ease: 'anticipate',
      },
      width: '30vw',
      x: '50vw',
    },
    open: {
      boxShadow: '1px 1px 10px 5px rgba(0, 0, 0, 0.3)',
      height: 'calc(100vh - 170px)',
      maxWidth: '600px',
      minWidth: '400px',
      position: 'absolute',
      right: '20px',

      top: '75px',
      transition: {
        damping: 10,
        delay: 0,
        duration: 0.4,
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
        const width = `${constrainRightSidebarWidth(start + left - mouseMoveEvent.clientX)}px`;
        setSidebar({ rightWidth: width });
      }
    },
    [isResizing, isResizingRight, setSidebar, sidebar.rightWidth],
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
        <MainContainer
          leftSidebarWidth={sidebar.leftWidth}
          rightExpanded={showSideQueue && sideQueueType === 'sideQueue'}
          rightSidebarWidth={sidebar.rightWidth}
          shell={shell}
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
              <AnimatePresence
                initial={false}
                mode="wait"
              >
                {isQueueDrawerButtonVisible && (
                  <QueueDrawerArea
                    key="queue-drawer-button"
                    animate="visible"
                    exit="hidden"
                    initial="hidden"
                    variants={queueDrawerButtonVariants}
                    whileHover={{ opacity: 1, scale: 2, transition: { duration: 0.5 } }}
                    onMouseEnter={handleEnterDrawerButton}
                    onMouseLeave={handleLeaveDrawerButton}
                  >
                    <TbArrowBarLeft size={12} />
                  </QueueDrawerArea>
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
                    <DrawerPlayQueue />
                  </QueueDrawer>
                )}
              </AnimatePresence>
              <AnimatePresence
                key="queue-sidebar"
                presenceAffectsLayout
                initial={false}
                mode="wait"
              >
                {showSideQueue && (
                  <>
                    {sideQueueType === 'sideQueue' ? (
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
                        <SidebarPlayQueue />
                      </RightSidebarContainer>
                    ) : (
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
                        <DrawerPlayQueue />
                      </QueueDrawer>
                    )}
                  </>
                )}
              </AnimatePresence>
            </>
          )}
          <Suspense fallback={<></>}>
            <Outlet />
          </Suspense>
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
