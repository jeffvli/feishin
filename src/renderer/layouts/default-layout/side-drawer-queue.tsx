import { useDisclosure, useTimeout } from '@mantine/hooks';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useCallback } from 'react';
import { useLocation } from 'react-router';

import styles from './side-drawer-queue.module.css';

import { DrawerPlayQueue } from '/@/renderer/features/now-playing';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStore, useSidebarStore } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Platform } from '/@/shared/types/types';

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

export const SideDrawerQueue = () => {
    const location = useLocation();
    const [drawer, drawerHandler] = useDisclosure(false);
    const { rightExpanded } = useSidebarStore();

    const drawerTimeout = useTimeout(() => drawerHandler.open(), 500);

    const handleEnterDrawerButton = useCallback(() => {
        drawerTimeout.start();
    }, [drawerTimeout]);

    const handleLeaveDrawerButton = useCallback(() => {
        drawerTimeout.clear();
    }, [drawerTimeout]);

    const isQueueDrawerButtonVisible =
        !rightExpanded && !drawer && location.pathname !== AppRoute.NOW_PLAYING;

    return (
        <AnimatePresence
            initial={false}
            mode="wait"
        >
            {isQueueDrawerButtonVisible && (
                <motion.div
                    animate="visible"
                    className={styles.queueDrawerArea}
                    exit="hidden"
                    initial="hidden"
                    key="queue-drawer-button"
                    onMouseEnter={handleEnterDrawerButton}
                    onMouseLeave={handleLeaveDrawerButton}
                    variants={queueDrawerButtonVariants}
                    whileHover={{ opacity: 1, scale: 2, transition: { duration: 0.5 } }}
                >
                    <Icon
                        icon="arrowLeftToLine"
                        size="lg"
                    />
                </motion.div>
            )}

            {drawer && (
                <motion.div
                    animate="open"
                    className={styles.queueDrawer}
                    exit="closed"
                    initial="closed"
                    key="queue-drawer"
                    onMouseLeave={() => {
                        // The drawer will close due to the delay when setting isReorderingQueue
                        setTimeout(() => {
                            if (useAppStore.getState().isReorderingQueue) return;
                            drawerHandler.close();
                        }, 50);
                    }}
                    variants={queueDrawerVariants}
                >
                    <DrawerPlayQueue />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
