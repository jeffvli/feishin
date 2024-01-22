import { AnimatePresence, motion, Variants } from 'framer-motion';
import { forwardRef, Ref } from 'react';
import { useLocation } from 'react-router';
import styled from 'styled-components';
import { SidebarPlayQueue, DrawerPlayQueue } from '/@/renderer/features/now-playing';
import { ResizeHandle } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useGeneralSettings, useSidebarStore, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/renderer/types';

const RightSidebarContainer = styled(motion.aside)`
    position: relative;
    grid-area: right-sidebar;
    height: 100%;
    background: var(--sidebar-bg);
    border-left: var(--sidebar-border);
`;

const queueSidebarVariants: Variants = {
    closed: (rightWidth) => ({
        transition: { duration: 0.5 },
        width: rightWidth,
        x: 1000,
        zIndex: 120,
    }),
    open: (rightWidth) => ({
        transition: {
            duration: 0.5,
            ease: 'anticipate',
        },
        width: rightWidth,
        x: 0,
        zIndex: 120,
    }),
};

const QueueDrawer = styled(motion.div)`
    background: var(--main-bg);
    border: 3px solid var(--generic-border-color);
    border-radius: 10px;
`;

const queueDrawerVariants: Variants = {
    closed: (windowBarStyle) => ({
        height:
            windowBarStyle === Platform.WINDOWS || Platform.MACOS
                ? 'calc(100vh - 205px)'
                : 'calc(100vh - 175px)',
        position: 'absolute',
        right: 0,
        top: '75px',
        transition: {
            duration: 0.4,
            ease: 'anticipate',
        },
        width: '450px',
        x: '50vw',
    }),
    open: (windowBarStyle) => ({
        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.8)',
        height:
            windowBarStyle === Platform.WINDOWS || Platform.MACOS
                ? 'calc(100vh - 205px)'
                : 'calc(100vh - 175px)',
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
        width: '450px',
        x: 0,
        zIndex: 120,
    }),
};

interface RightSidebarProps {
    isResizing: boolean;
    startResizing: (direction: 'left' | 'right') => void;
}

export const RightSidebar = forwardRef(
    (
        { isResizing: isResizingRight, startResizing }: RightSidebarProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { windowBarStyle } = useWindowSettings();
        const { rightWidth, rightExpanded } = useSidebarStore();
        const { sideQueueType } = useGeneralSettings();
        const location = useLocation();
        const showSideQueue = rightExpanded && location.pathname !== AppRoute.NOW_PLAYING;

        return (
            <AnimatePresence
                key="queue-sidebar"
                presenceAffectsLayout
                initial={false}
                mode="sync"
            >
                {showSideQueue && (
                    <>
                        {sideQueueType === 'sideQueue' ? (
                            <RightSidebarContainer
                                key="queue-sidebar"
                                animate="open"
                                custom={rightWidth}
                                exit="closed"
                                id="sidebar-queue"
                                initial="closed"
                                variants={queueSidebarVariants}
                            >
                                <ResizeHandle
                                    ref={ref}
                                    $isResizing={isResizingRight}
                                    $placement="left"
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
                                custom={windowBarStyle}
                                exit="closed"
                                id="drawer-queue"
                                initial="closed"
                                variants={queueDrawerVariants}
                            >
                                <DrawerPlayQueue />
                            </QueueDrawer>
                        )}
                    </>
                )}
            </AnimatePresence>
        );
    },
);
