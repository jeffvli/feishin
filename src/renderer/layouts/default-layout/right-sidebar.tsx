import { AnimatePresence, motion, Variants } from 'motion/react';
import { forwardRef, Ref } from 'react';
import { useLocation } from 'react-router';

import styles from './right-sidebar.module.css';

import { DrawerPlayQueue, SidebarPlayQueue } from '/@/renderer/features/now-playing';
import { ResizeHandle } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useGeneralSettings, useSidebarStore, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/shared/types/types';

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
        const { rightExpanded, rightWidth } = useSidebarStore();
        const { sideQueueType } = useGeneralSettings();
        const location = useLocation();
        const showSideQueue = rightExpanded && location.pathname !== AppRoute.NOW_PLAYING;

        return (
            <AnimatePresence
                initial={false}
                key="queue-sidebar"
                mode="sync"
                presenceAffectsLayout
            >
                {showSideQueue && (
                    <>
                        {sideQueueType === 'sideQueue' ? (
                            <motion.aside
                                animate="open"
                                className={styles.rightSidebarContainer}
                                custom={rightWidth}
                                exit="closed"
                                id="sidebar-queue"
                                initial="closed"
                                key="queue-sidebar"
                                variants={queueSidebarVariants}
                            >
                                <ResizeHandle
                                    isResizing={isResizingRight}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        startResizing('right');
                                    }}
                                    placement="left"
                                    ref={ref}
                                />
                                <SidebarPlayQueue />
                            </motion.aside>
                        ) : (
                            <motion.div
                                animate="open"
                                className={styles.queueDrawer}
                                custom={windowBarStyle}
                                exit="closed"
                                id="drawer-queue"
                                initial="closed"
                                key="queue-drawer"
                                variants={queueDrawerVariants}
                            >
                                <DrawerPlayQueue />
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>
        );
    },
);
