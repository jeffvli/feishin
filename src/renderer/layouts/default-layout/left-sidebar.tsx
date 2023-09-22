import { useRef } from 'react';
import styled from 'styled-components';
import { ResizeHandle } from '/@/renderer/features/shared';
import { CollapsedSidebar } from '/@/renderer/features/sidebar/components/collapsed-sidebar';
import { Sidebar } from '/@/renderer/features/sidebar/components/sidebar';
import { useSidebarStore } from '/@/renderer/store';

const SidebarContainer = styled.aside`
    position: relative;
    grid-area: sidebar;
    background: var(--sidebar-bg);
    border-right: var(--sidebar-border);
`;

interface LeftSidebarProps {
    isResizing: boolean;
    startResizing: (direction: 'left' | 'right') => void;
}

export const LeftSidebar = ({ isResizing, startResizing }: LeftSidebarProps) => {
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const { collapsed } = useSidebarStore();

    return (
        <SidebarContainer id="sidebar">
            <ResizeHandle
                ref={sidebarRef}
                $isResizing={isResizing}
                $placement="right"
                onMouseDown={(e) => {
                    e.preventDefault();
                    startResizing('left');
                }}
            />
            {collapsed ? <CollapsedSidebar /> : <Sidebar />}
        </SidebarContainer>
    );
};
