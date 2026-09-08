import { memo } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { SharedFullscreenPlayerSettings } from '/@/renderer/features/player/components/shared-full-screen-player-settings';
import { useFullScreenPlayerStore } from '/@/renderer/store';

export const MobileFullscreenPlayerHeader = memo(() => {
    const { opacity } = useFullScreenPlayerStore();

    return (
        <div
            className={styles.header}
            style={{
                background: `rgb(var(--theme-colors-background-transparent), ${opacity}%)`,
            }}
        >
            <SharedFullscreenPlayerSettings />
        </div>
    );
});

MobileFullscreenPlayerHeader.displayName = 'MobileFullscreenPlayerHeader';
