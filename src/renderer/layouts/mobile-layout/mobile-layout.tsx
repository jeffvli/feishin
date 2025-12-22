import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { lazy } from 'react';
import { Outlet } from 'react-router';

import styles from './mobile-layout.module.css';

import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { MobileFullscreenPlayer } from '/@/renderer/features/player/components/mobile-fullscreen-player';
import { CommandPalette } from '/@/renderer/features/search/components/command-palette';
import { MobileSidebar } from '/@/renderer/features/sidebar/components/mobile-sidebar';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';
import { useFullScreenPlayerStore } from '/@/renderer/store';
import { useCommandPalette, useWindowSettings } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Drawer } from '/@/shared/components/drawer/drawer';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { Platform } from '/@/shared/types/types';

const WindowBar = lazy(() =>
    import('/@/renderer/layouts/window-bar').then((module) => ({
        default: module.WindowBar,
    })),
);

interface MobileLayoutProps {
    shell?: boolean;
}

export const MobileLayout = ({ shell }: MobileLayoutProps) => {
    const { opened, ...handlers } = useCommandPalette();
    const [sidebarOpened, { close: closeSidebar, open: openSidebar }] = useDisclosure(false);
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const { windowBarStyle } = useWindowSettings();

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
                <ActionIcon
                    className={styles.drawerButton}
                    icon="menu"
                    onClick={openSidebar}
                    size="lg"
                    tooltip={{ label: 'Menu' }}
                    variant="subtle"
                />
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
                <PlayerBar />
            </div>
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
                withCloseButton={false}
            >
                <MobileSidebar />
            </Drawer>
            <AnimatePresence initial={false}>
                {isFullScreenPlayerExpanded && (
                    <div className={styles.fullScreenPlayerOverlay}>
                        <MobileFullscreenPlayer />
                    </div>
                )}
            </AnimatePresence>
            <CommandPalette modalProps={{ handlers, opened }} />
            <ContextMenuController.Root />
        </>
    );
};
