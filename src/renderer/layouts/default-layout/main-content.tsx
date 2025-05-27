import clsx from 'clsx';
import throttle from 'lodash/throttle';
import { motion } from 'motion/react';
import {
    CSSProperties,
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Outlet, useLocation } from 'react-router';

import styles from './main-content.module.css';

import { FullScreenOverlay } from '/@/renderer/layouts/default-layout/full-screen-overlay';
import { LeftSidebar } from '/@/renderer/layouts/default-layout/left-sidebar';
import { RightSidebar } from '/@/renderer/layouts/default-layout/right-sidebar';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStoreActions, useSidebarStore } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { constrainRightSidebarWidth, constrainSidebarWidth } from '/@/renderer/utils';
import { Spinner } from '/@/shared/components/spinner/spinner';

const SideDrawerQueue = lazy(() =>
    import('/@/renderer/layouts/default-layout/side-drawer-queue').then((module) => ({
        default: module.SideDrawerQueue,
    })),
);

const MINIMUM_SIDEBAR_WIDTH = 260;

export const MainContent = ({ shell }: { shell?: boolean }) => {
    const location = useLocation();
    const { collapsed, leftWidth, rightExpanded, rightWidth } = useSidebarStore();
    const { setSideBar } = useAppStoreActions();
    const { showQueueDrawerButton, sideQueueType } = useGeneralSettings();
    const [isResizing, setIsResizing] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

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
                const width = `${constrainRightSidebarWidth(
                    start + left - mouseMoveEvent.clientX,
                )}px`;
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
        <motion.div
            className={clsx(styles.mainContentContainer, {
                [styles.rightExpanded]: showSideQueue && sideQueueType === 'sideQueue',
                [styles.shell]: shell,
                [styles.sidebarCollapsed]: collapsed,
                [styles.sidebarExpanded]: !collapsed,
            })}
            id="main-content"
            style={
                {
                    '--right-sidebar-width': rightWidth,
                    '--sidebar-width': leftWidth,
                } as CSSProperties
            }
        >
            {!shell && (
                <>
                    <Suspense fallback={<></>}>
                        {showQueueDrawerButton && <SideDrawerQueue />}
                    </Suspense>
                    <FullScreenOverlay />
                    <LeftSidebar
                        isResizing={isResizing}
                        startResizing={startResizing}
                    />
                    <RightSidebar
                        isResizing={isResizingRight}
                        ref={rightSidebarRef}
                        startResizing={startResizing}
                    />
                </>
            )}
            <Suspense fallback={<Spinner container />}>
                <Outlet />
            </Suspense>
        </motion.div>
    );
};
