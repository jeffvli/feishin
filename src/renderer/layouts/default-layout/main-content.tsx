import clsx from 'clsx';
import { motion } from 'motion/react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import { shallow } from 'zustand/shallow';

import styles from './main-content.module.css';

import { ExpandedListContainer } from '/@/renderer/components/item-list/expanded-list-container';
import { ExpandedListItem } from '/@/renderer/components/item-list/expanded-list-item';
import { FullScreenOverlay } from '/@/renderer/layouts/default-layout/full-screen-overlay';
import { FullScreenVisualizerOverlay } from '/@/renderer/layouts/default-layout/full-screen-visualizer-overlay';
import { LeftSidebar } from '/@/renderer/layouts/default-layout/left-sidebar';
import { RightSidebar } from '/@/renderer/layouts/default-layout/right-sidebar';
import {
    useAppStore,
    useAppStoreActions,
    useGlobalExpanded,
    useSideQueueLayout,
    useSideQueueType,
} from '/@/renderer/store';
import { constrainRightSidebarWidth, constrainSidebarWidth } from '/@/renderer/utils';
import { Spinner } from '/@/shared/components/spinner/spinner';

const MINIMUM_SIDEBAR_WIDTH = 260;

export const MainContent = ({ shell }: { shell?: boolean }) => {
    const { collapsed, leftWidth, rightExpanded, rightHeight, rightWidth } = useAppStore(
        (state) => ({
            collapsed: state.sidebar.collapsed,
            leftWidth: state.sidebar.leftWidth,
            rightExpanded: state.sidebar.rightExpanded,
            rightHeight: state.sidebar.rightHeight,
            rightWidth: state.sidebar.rightWidth,
        }),
        shallow,
    );
    const { setSideBar } = useAppStoreActions();
    const sideQueueType = useSideQueueType();
    const sideQueueLayout = useSideQueueLayout();
    const [isResizing, setIsResizing] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const rightSidebarRef = useRef<HTMLDivElement | null>(null);
    const mainContentRef = useRef<HTMLDivElement | null>(null);
    const initialRightWidthRef = useRef<string>(rightWidth);
    const initialRightHeightRef = useRef<string>(rightHeight);
    const initialMouseXRef = useRef<number>(0);
    const initialMouseYRef = useRef<number>(0);
    const wasCollapsedDuringDragRef = useRef<boolean>(false);

    useEffect(() => {
        if (mainContentRef.current && !isResizing && !isResizingRight) {
            mainContentRef.current.style.setProperty('--sidebar-width', leftWidth);
            mainContentRef.current.style.setProperty('--right-sidebar-width', rightWidth);
            mainContentRef.current.style.setProperty('--right-sidebar-height', rightHeight);
            initialRightWidthRef.current = rightWidth;
            initialRightHeightRef.current = rightHeight;
        }
    }, [leftWidth, rightWidth, rightHeight, isResizing, isResizingRight]);

    const startResizing = useCallback(
        (position: 'left' | 'right' | 'top', mouseEvent?: MouseEvent) => {
            if (position === 'left') {
                setIsResizing(true);
                wasCollapsedDuringDragRef.current = false;
            } else {
                setIsResizingRight(true);
                if (mainContentRef.current && rightSidebarRef.current && mouseEvent) {
                    if (position === 'top') {
                        const currentHeight =
                            mainContentRef.current.style.getPropertyValue('--right-sidebar-height');
                        if (currentHeight) {
                            initialRightHeightRef.current = currentHeight;
                        } else {
                            initialRightHeightRef.current = rightHeight;
                        }
                        initialMouseYRef.current = mouseEvent.clientY;
                    } else {
                        const currentWidth =
                            mainContentRef.current.style.getPropertyValue('--right-sidebar-width');
                        if (currentWidth) {
                            initialRightWidthRef.current = currentWidth;
                        } else {
                            initialRightWidthRef.current = rightWidth;
                        }
                        initialMouseXRef.current = mouseEvent.clientX;
                    }
                } else {
                    if (position === 'top') {
                        initialRightHeightRef.current = rightHeight;
                    } else {
                        initialRightWidthRef.current = rightWidth;
                    }
                }
            }
        },
        [rightHeight, rightWidth],
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
            if (sideQueueLayout === 'vertical') {
                const finalHeight =
                    mainContentRef.current.style.getPropertyValue('--right-sidebar-height');
                if (finalHeight) {
                    setSideBar({ rightHeight: finalHeight });
                }
            } else {
                const finalWidth =
                    mainContentRef.current.style.getPropertyValue('--right-sidebar-width');
                if (finalWidth) {
                    setSideBar({ rightWidth: finalWidth });
                }
            }
            setIsResizingRight(false);
        }
    }, [isResizing, isResizingRight, setSideBar, sideQueueLayout]);

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
                if (sideQueueLayout === 'vertical') {
                    const initialHeight = Number(initialRightHeightRef.current.split('px')[0]);
                    const initialMouseY = initialMouseYRef.current;
                    const deltaY = mouseMoveEvent.clientY - initialMouseY;
                    const containerHeight = mainContentRef.current.clientHeight;
                    const minHeight = 220;
                    const maxHeight = Math.max(minHeight, containerHeight - 200);
                    const newHeight = initialHeight - deltaY;
                    const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
                    mainContentRef.current.style.setProperty(
                        '--right-sidebar-height',
                        `${clampedHeight}px`,
                    );
                } else {
                    const initialWidth = Number(initialRightWidthRef.current.split('px')[0]);
                    const initialMouseX = initialMouseXRef.current;
                    const deltaX = mouseMoveEvent.clientX - initialMouseX;
                    const newWidth = initialWidth - deltaX;
                    const width = `${constrainRightSidebarWidth(newWidth)}px`;
                    mainContentRef.current.style.setProperty('--right-sidebar-width', width);
                }
            }
        },
        [isResizing, isResizingRight, setSideBar, sideQueueLayout],
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
                [styles.verticalLayout]:
                    rightExpanded &&
                    sideQueueType === 'sideQueue' &&
                    sideQueueLayout === 'vertical',
            })}
            id="main-content"
            ref={mainContentRef}
        >
            {!shell && (
                <>
                    <FullScreenVisualizerOverlay />
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

function GlobalExpandedPanel() {
    const globalExpanded = useGlobalExpanded();

    if (!globalExpanded) return null;

    return (
        <ExpandedListContainer>
            <ExpandedListItem item={globalExpanded.item} itemType={globalExpanded.itemType} />
        </ExpandedListContainer>
    );
}

function MainContentBody() {
    return (
        <div className={styles.mainContentBody}>
            <div className={styles.mainContentBodyScroll}>
                <Suspense fallback={<Spinner container />}>
                    <Outlet />
                </Suspense>
            </div>
            <GlobalExpandedPanel />
        </div>
    );
}
