import clsx from 'clsx';
import { MouseEvent } from 'react';

import styles from './playerbar.module.css';

import { CenterControls } from '/@/renderer/features/player/components/center-controls';
import { LeftControls } from '/@/renderer/features/player/components/left-controls';
import { MobilePlayerbar } from '/@/renderer/features/player/components/mobile-playerbar';
import { RightControls } from '/@/renderer/features/player/components/right-controls';
import { usePowerSaveBlocker } from '/@/renderer/features/player/hooks/use-power-save-blocker';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { useFullScreenPlayerStore, useSetFullScreenPlayerStore } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';

export const Playerbar = () => {
    const { playerbarOpenDrawer } = useGeneralSettings();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const isMobile = useIsMobile();

    usePowerSaveBlocker();

    const handleToggleFullScreenPlayer = (e?: KeyboardEvent | MouseEvent<HTMLDivElement>) => {
        e?.stopPropagation();
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    if (isMobile) {
        return <MobilePlayerbar />;
    }

    return (
        <div
            className={clsx(styles.container, PlaybackSelectors.mediaPlayer)}
            onClick={playerbarOpenDrawer ? handleToggleFullScreenPlayer : undefined}
        >
            <div className={styles.controlsGrid}>
                <div className={styles.leftGridItem}>
                    <LeftControls />
                </div>
                <div className={styles.centerGridItem}>
                    <CenterControls />
                </div>
                <div className={styles.rightGridItem}>
                    <RightControls />
                </div>
            </div>
            {/* {playbackType === PlayerType.WEB && (
                <AudioPlayer
                    // autoNext={autoNextFn}
                    crossfadeDuration={settings.crossfadeDuration}
                    crossfadeStyle={settings.crossfadeStyle}
                    currentPlayer={player}
                    muted={muted}
                    playbackStyle={settings.style}
                    player1={player1}
                    player2={player2}
                    ref={playersRef}
                    status={status}
                    style={settings.style as any}
                    volume={(volume / 100) ** 2}
                />
            )} */}
        </div>
    );
};
