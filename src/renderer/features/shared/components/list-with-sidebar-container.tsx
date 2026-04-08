import { motion } from 'motion/react';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import styles from './list-with-sidebar-container.module.css';

import { useListContext } from '/@/renderer/context/list-context';
import { animationProps } from '/@/shared/components/animations/animation-props';
import { Portal } from '/@/shared/components/portal/portal';

interface ListWithSidebarContainerContextValue {
    sidebarElement: HTMLDivElement | null;
}

const ListWithSidebarContainerContext = createContext<ListWithSidebarContainerContextValue | null>(
    null,
);

interface ListWithSidebarContainerProps {
    children: ReactNode;
    sidebarBreakpoint?: number;
    useBreakpoint?: boolean;
}

interface SidebarPortalProps {
    children: ReactNode;
}

interface SidebarProps {
    children: ReactNode;
}

function Sidebar({ children }: SidebarProps) {
    const context = useContext(ListWithSidebarContainerContext);

    if (!context) {
        throw new Error('Sidebar must be used within ListWithSidebarContainer');
    }

    if (!context.sidebarElement) {
        return null;
    }

    return (
        <Portal target={context.sidebarElement}>
            <motion.div {...animationProps.slideInLeft} style={{ height: '100%', width: '100%' }}>
                {children}
            </motion.div>
        </Portal>
    );
}

function SidebarPortal({ children }: SidebarPortalProps) {
    const context = useContext(ListWithSidebarContainerContext);

    if (!context) {
        throw new Error('SidebarPortal must be used within ListWithSidebarContainer');
    }

    if (!context.sidebarElement) {
        return null;
    }

    return <Portal target={context.sidebarElement}>{children}</Portal>;
}

export const ListWithSidebarContainer = ({
    children,
    useBreakpoint = false,
}: ListWithSidebarContainerProps) => {
    const [sidebarElement, setSidebarElement] = useState<HTMLDivElement | null>(null);
    const { isSidebarOpen = false } = useListContext();

    const contextValue = useMemo(
        () => ({
            sidebarElement,
        }),
        [sidebarElement],
    );

    return (
        <ListWithSidebarContainerContext.Provider value={contextValue}>
            <div
                className={styles.container}
                data-sidebar-open={useBreakpoint ? undefined : isSidebarOpen}
                data-use-breakpoint={useBreakpoint}
            >
                <div className={styles.sidebarContainer} ref={setSidebarElement} />
                <div className={styles.contentContainer}>{children}</div>
            </div>
        </ListWithSidebarContainerContext.Provider>
    );
};

ListWithSidebarContainer.Sidebar = Sidebar;
ListWithSidebarContainer.SidebarPortal = SidebarPortal;
