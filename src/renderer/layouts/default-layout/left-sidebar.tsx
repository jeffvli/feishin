import { useRef } from 'react';

import styles from './left-sidebar.module.css';

import { ResizeHandle } from '/@/renderer/features/shared';
import { CollapsedSidebar } from '/@/renderer/features/sidebar/components/collapsed-sidebar';
import { Sidebar } from '/@/renderer/features/sidebar/components/sidebar';
import { useSidebarStore } from '/@/renderer/store';

interface LeftSidebarProps {
    isResizing: boolean;
    startResizing: (direction: 'left' | 'right') => void;
}

export const LeftSidebar = ({ isResizing, startResizing }: LeftSidebarProps) => {
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const { collapsed } = useSidebarStore();

    return (
        <aside
            className={styles.container}
            id="sidebar"
        >
            <ResizeHandle
                isResizing={isResizing}
                onMouseDown={(e) => {
                    e.preventDefault();
                    startResizing('left');
                }}
                placement="right"
                ref={sidebarRef}
            />
            {collapsed ? <CollapsedSidebar /> : <Sidebar />}
        </aside>
    );
};
