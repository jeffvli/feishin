import { motion } from 'motion/react';
import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';

import styles from './list-with-sidebar-container.module.css';

import { useListContext } from '/@/renderer/context/list-context';
import { animationProps } from '/@/shared/components/animations/animation-props';
import { Portal } from '/@/shared/components/portal/portal';

interface ListWithSidebarContainerContextValue {
    sidebarRef: React.RefObject<HTMLDivElement | null>;
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

    if (!context.sidebarRef?.current) {
        return null;
    }

    return (
        <Portal target={context.sidebarRef.current}>
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

    if (!context.sidebarRef?.current) {
        return null;
    }

    return <Portal target={context.sidebarRef.current}>{children}</Portal>;
}

export const ListWithSidebarContainer = ({
    children,
    useBreakpoint = false,
}: ListWithSidebarContainerProps) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { isSidebarOpen = false } = useListContext();

    const contextValue = useMemo(
        () => ({
            sidebarRef,
        }),
        [],
    );

    return (
        <ListWithSidebarContainerContext.Provider value={contextValue}>
            <div
                className={styles.container}
                data-sidebar-open={useBreakpoint ? undefined : isSidebarOpen}
                data-use-breakpoint={useBreakpoint}
            >
                <div className={styles.sidebarContainer} ref={sidebarRef} />
                <div className={styles.contentContainer}>{children}</div>
            </div>
        </ListWithSidebarContainerContext.Provider>
    );
};

ListWithSidebarContainer.Sidebar = Sidebar;
ListWithSidebarContainer.SidebarPortal = SidebarPortal;
