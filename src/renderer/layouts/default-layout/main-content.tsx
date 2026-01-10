import clsx from 'clsx';
import { motion } from 'motion/react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import { shallow } from 'zustand/shallow';

import styles from './main-content.module.css';

import { FullScreenOverlay } from '/@/renderer/layouts/default-layout/full-screen-overlay';
import { LeftSidebar } from '/@/renderer/layouts/default-layout/left-sidebar';
import { RightSidebar } from '/@/renderer/layouts/default-layout/right-sidebar';
import { useAppStore, useAppStoreActions, useSideQueueType } from '/@/renderer/store';
import { constrainRightSidebarWidth, constrainSidebarWidth } from '/@/renderer/utils';
import { Spinner } from '/@/shared/components/spinner/spinner';

const MINIMUM_SIDEBAR_WIDTH = 260;

export const MainContent = ({ shell }: { shell?: boolean }) => {
    const { collapsed, leftWidth, rightExpanded, rightWidth } = useAppStore(
        (state) => ({
            collapsed: state.sidebar.collapsed,
            leftWidth: state.sidebar.leftWidth,
            rightExpanded: state.sidebar.rightExpanded,
            rightWidth: state.sidebar.rightWidth,
        }),
        shallow,
    );
    const { setSideBar } = useAppStoreActions();
    const sideQueueType = useSideQueueType();
    const [isResizing, setIsResizing] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const rightSidebarRef = useRef<HTMLDivElement | null>(null);
    const mainContentRef = useRef<HTMLDivElement | null>(null);
    const initialRightWidthRef = useRef<string>(rightWidth);
    const initialMouseXRef = useRef<number>(0);
    const wasCollapsedDuringDragRef = useRef<boolean>(false);

    useEffect(() => {
        if (mainContentRef.current && !isResizing && !isResizingRight) {
            mainContentRef.current.style.setProperty('--sidebar-width', leftWidth);
            mainContentRef.current.style.setProperty('--right-sidebar-width', rightWidth);
            initialRightWidthRef.current = rightWidth;
        }
    }, [leftWidth, rightWidth, isResizing, isResizingRight]);

    const startResizing = useCallback(
        (position: 'left' | 'right', mouseEvent?: MouseEvent) => {
            if (position === 'left') {
                setIsResizing(true);
                wasCollapsedDuringDragRef.current = false;
            } else {
                setIsResizingRight(true);
                if (mainContentRef.current && rightSidebarRef.current && mouseEvent) {
                    const currentWidth =
                        mainContentRef.current.style.getPropertyValue('--right-sidebar-width');
                    if (currentWidth) {
                        initialRightWidthRef.current = currentWidth;
                    } else {
                        initialRightWidthRef.current = rightWidth;
                    }
                    initialMouseXRef.current = mouseEvent.clientX;
                } else {
                    initialRightWidthRef.current = rightWidth;
                }
            }
        },
        [rightWidth],
    );

    const stopResizing = useCallback(() => {
        if (isResizing && mainContentRef.current) {
            if (!wasCollapsedDuringDragRef.current) {
                const finalWidth = mainContentRef.current.style.getPropertyValue('--sidebar-width');
                if (finalWidth) {
                    setSideBar({ collapsed: false, leftWidth: finalWidth });
                }
            }
            setIsResizing(false);
            wasCollapsedDuringDragRef.current = false;
        } else if (isResizingRight && mainContentRef.current) {
            const finalWidth =
                mainContentRef.current.style.getPropertyValue('--right-sidebar-width');
            if (finalWidth) {
                setSideBar({ rightWidth: finalWidth });
            }
            setIsResizingRight(false);
        }
    }, [isResizing, isResizingRight, setSideBar]);

    const resize = useCallback(
        (mouseMoveEvent: any) => {
            if (!mainContentRef.current) return;

            if (isResizing) {
                const width = mouseMoveEvent.clientX;
                const constrainedWidthValue = constrainSidebarWidth(width);
                const constrainedWidth = `${constrainedWidthValue}px`;

                if (width < MINIMUM_SIDEBAR_WIDTH - 100) {
                    if (!wasCollapsedDuringDragRef.current) {
                        wasCollapsedDuringDragRef.current = true;
                        setSideBar({ collapsed: true });
                    }
                } else {
                    if (wasCollapsedDuringDragRef.current) {
                        wasCollapsedDuringDragRef.current = false;
                        setSideBar({ collapsed: false });
                    }
                    mainContentRef.current.style.setProperty('--sidebar-width', constrainedWidth);
                }
            } else if (isResizingRight) {
                const initialWidth = Number(initialRightWidthRef.current.split('px')[0]);
                const initialMouseX = initialMouseXRef.current;
                const deltaX = mouseMoveEvent.clientX - initialMouseX;
                const newWidth = initialWidth - deltaX;
                const width = `${constrainRightSidebarWidth(newWidth)}px`;
                mainContentRef.current.style.setProperty('--right-sidebar-width', width);
            }
        },
        [isResizing, isResizingRight, setSideBar],
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
        <motion.div
            className={clsx(styles.mainContentContainer, {
                [styles.rightExpanded]: rightExpanded && sideQueueType === 'sideQueue',
                [styles.shell]: shell,
                [styles.sidebarCollapsed]: collapsed,
                [styles.sidebarExpanded]: !collapsed,
            })}
            id="main-content"
            ref={mainContentRef}
        >
            {!shell && (
                <>
                    <FullScreenOverlay />
                    <LeftSidebar isResizing={isResizing} startResizing={startResizing} />
                    <RightSidebar
                        isResizing={isResizingRight}
                        ref={rightSidebarRef}
                        startResizing={startResizing}
                    />
                </>
            )}
            <MainContentBody />
        </motion.div>
    );
};

function MainContentBody() {
    return (
        <Suspense fallback={<Spinner container />}>
            <Outlet />
        </Suspense>
    );
}
