import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';

import styles from './mobile-layout.module.css';

import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { FullScreenVisualizer } from '/@/renderer/features/player/components/full-screen-visualizer';
import { MobileSidebar } from '/@/renderer/features/sidebar/components/mobile-sidebar';
import { SourRoot } from '/@/renderer/features/sour/components/sour-root';
import { MobileNav } from '/@/renderer/features/sour/mobile/mobile-nav';
import { isWebApp } from '/@/renderer/features/sour/mobile/offline';
import { WebOffline } from '/@/renderer/features/sour/mobile/web-offline';
import { toggleStage } from '/@/renderer/features/sour/stage/sour-stage';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';
import { WindowBar } from '/@/renderer/layouts/window-bar';
import {
    useFullScreenPlayerOverlayState,
    useFullScreenPlayerStore,
    useWindowBarStyle,
} from '/@/renderer/store';
import { Drawer } from '/@/shared/components/drawer/drawer';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { Platform } from '/@/shared/types/types';

interface MobileLayoutProps {
    shell?: boolean;
}

export const MobileLayout = ({ shell }: MobileLayoutProps) => {
    const [sidebarOpened, { close: closeSidebar, open: openSidebar }] = useDisclosure(false);
    const {
        expanded: isFullScreenPlayerExpanded,
        visualizerExpanded: isFullScreenVisualizerExpanded,
    } = useFullScreenPlayerOverlayState();
    const windowBarStyle = useWindowBarStyle();
    const { pathname } = useLocation();
    // the full screen player on phones is the Sour Stage
    useEffect(() => {
        if (!isFullScreenPlayerExpanded) return;
        useFullScreenPlayerStore.getState().actions.setStore({ expanded: false });
        toggleStage(true);
    }, [isFullScreenPlayerExpanded]);
    // the menu closes once something in it was picked
    const lastPath = useRef(pathname);
    useEffect(() => {
        if (lastPath.current === pathname) return;
        lastPath.current = pathname;
        closeSidebar();
    }, [pathname, closeSidebar]);

    return (
        <>
            <div
                className={clsx(styles.layout, {
                    [styles.macos]: windowBarStyle === Platform.MACOS,
                    [styles.windows]: windowBarStyle === Platform.WINDOWS,
                })}
                id="mobile-layout"
            >
                {!shell && <WindowBar />}
                <main className={styles.mainContent}>
                    <Suspense fallback={<Spinner container />}>
                        <Outlet />
                    </Suspense>
                </main>
                <PlayerBar />
                {!shell && <MobileNav onMenu={openSidebar} />}
            </div>
            {/* the Sour Stage, holiday skins, social pop-ups... (same as on computers) */}
            <SourRoot />
            {isWebApp() && <WebOffline />}
            {!shell && (
                <Drawer
                    onClose={closeSidebar}
                    opened={sidebarOpened}
                    position="left"
                    size="320px"
                    styles={{
                        body: {
                            height: '100%',
                            padding: 0,
                        },
                        content: {
                            height: '100%',
                            width: '100%',
                        },
                    }}
                    // don't jump into the search box (and pop up the keyboard) on open
                    trapFocus={false}
                    withCloseButton={false}
                >
                    {/* picking something (a page, the Stage, the Studio...) closes the menu; opening a
                        section or the search/app menu at the top doesn't */}
                    <div
                        onClickCapture={(e) => {
                            const el = e.target as HTMLElement;
                            if (el.closest('#global-search-container, .mantine-Accordion-control'))
                                return;
                            if (el.closest('a, button')) setTimeout(closeSidebar, 0);
                        }}
                        style={{ height: '100%' }}
                    >
                        <MobileSidebar />
                    </div>
                </Drawer>
            )}
            <AnimatePresence initial={false}>
                {isFullScreenVisualizerExpanded && (
                    <div className={styles.fullScreenPlayerOverlay}>
                        <FullScreenVisualizer />
                    </div>
                )}
            </AnimatePresence>
            <ContextMenuController.Root />
        </>
    );
};
