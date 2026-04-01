import clsx from 'clsx';
import { forwardRef, Ref } from 'react';

import styles from './right-sidebar.module.css';

import { SidebarPlayQueue } from '/@/renderer/features/now-playing/components/sidebar-play-queue';
import { ResizeHandle } from '/@/renderer/features/shared/components/resize-handle';
import { useAppStore, useSideQueueLayout, useSideQueueType } from '/@/renderer/store';

// const queueDrawerVariants: Variants = {
//     closed: (windowBarStyle) => ({
//         height:
//             windowBarStyle === Platform.WINDOWS || Platform.MACOS
//                 ? 'calc(100vh - 205px)'
//                 : 'calc(100vh - 175px)',
//         position: 'absolute',
//         right: 0,
//         top: '75px',
//         transition: {
//             duration: 0.4,
//             ease: 'anticipate',
//         },
//         width: '450px',
//         x: '50vw',
//     }),
//     open: (windowBarStyle) => ({
//         boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.8)',
//         height:
//             windowBarStyle === Platform.WINDOWS || Platform.MACOS
//                 ? 'calc(100vh - 205px)'
//                 : 'calc(100vh - 175px)',
//         position: 'absolute',
//         right: '20px',
//         top: '75px',
//         transition: {
//             damping: 10,
//             delay: 0,
//             duration: 0.4,
//             ease: 'anticipate',
//             mass: 0.5,
//         },
//         width: '450px',
//         x: 0,
//         zIndex: 120,
//     }),
// };

interface RightSidebarProps {
    isResizing: boolean;
    startResizing: (direction: 'left' | 'right' | 'top', mouseEvent?: MouseEvent) => void;
}

export const RightSidebar = forwardRef(
    (
        { isResizing: isResizingRight, startResizing }: RightSidebarProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const rightExpanded = useAppStore((state) => state.sidebar.rightExpanded);
        const sideQueueType = useSideQueueType();
        const sideQueueLayout = useSideQueueLayout();
        const isVerticalLayout = sideQueueLayout === 'vertical';

        return (
            <>
                {rightExpanded && sideQueueType === 'sideQueue' && (
                    <aside
                        className={clsx(styles.rightSidebarContainer, {
                            [styles.verticalLayout]: isVerticalLayout,
                        })}
                        id="sidebar-queue"
                        key="queue-sidebar"
                    >
                        <ResizeHandle
                            isResizing={isResizingRight}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                startResizing(isVerticalLayout ? 'top' : 'right', e.nativeEvent);
                            }}
                            placement={isVerticalLayout ? 'top' : 'left'}
                            ref={ref}
                        />
                        <SidebarPlayQueue />
                    </aside>
                )}
            </>
        );
    },
);
