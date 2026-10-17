import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';

import styles from './mobile-layout.module.css';

import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { FullScreenVisualizer } from '/@/renderer/features/player/components/full-screen-visualizer';
import { MobileFullscreenPlayer } from '/@/renderer/features/player/components/mobile-fullscreen-player';
import { MobileSidebar } from '/@/renderer/features/sidebar/components/mobile-sidebar';
import { SourRoot } from '/@/renderer/features/sour/components/sour-root';
import { MobileNav } from '/@/renderer/features/sour/mobile/mobile-nav';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';
import { WindowBar } from '/@/renderer/layouts/window-bar';
import { useFullScreenPlayerOverlayState, useWindowBarStyle } from '/@/renderer/store';
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
                    <MobileSidebar />
                </Drawer>
            )}
            <AnimatePresence initial={false}>
                {isFullScreenPlayerExpanded && (
                    <div className={styles.fullScreenPlayerOverlay}>
                        <MobileFullscreenPlayer />
                    </div>
                )}
            </AnimatePresence>
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
