import { motion, Variants } from 'motion/react';
import { lazy, memo, ReactNode, Suspense, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import styles from './full-screen-visualizer.module.css';

import { FullScreenVisualizerSongInfo } from '/@/renderer/features/player/components/full-screen-visualizer-song-info';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { useFullScreenPlayerStoreActions } from '/@/renderer/store/full-screen-player.store';
import {
    usePlaybackSettings,
    useSettingsStore,
    useWindowSettings,
} from '/@/renderer/store/settings.store';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { Platform } from '/@/shared/types/types';

const AudioMotionAnalyzerVisualizer = lazy(() =>
    import('../../visualizer/components/audiomotionanalyzer/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const ButterchurnVisualizer = lazy(() =>
    import('../../visualizer/components/butternchurn/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const containerVariants: Variants = {
    closed: (custom) => {
        const { isMobile, windowBarStyle } = custom;
        const height =
            windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
                ? 'calc(100vh - 120px)'
                : 'calc(100vh - 90px)';

        if (isMobile) {
            return {
                height,
                position: 'absolute',
                top: '100vh',
                transition: {
                    duration: 0.5,
                    ease: 'easeInOut',
                },
                width: '100vw',
                y: 0,
            };
        }
        return {
            height,
            position: 'absolute',
            top: '100vh',
            transition: {
                duration: 0.5,
                ease: 'easeInOut',
            },
            width: '100vw',
            y: 0,
        };
    },
    open: (custom) => {
        const { isMobile, windowBarStyle } = custom;
        const height =
            windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
                ? 'calc(100vh - 120px)'
                : 'calc(100vh - 90px)';
        const topOffset =
            windowBarStyle === Platform.WINDOWS || windowBarStyle === Platform.MACOS
                ? '30px'
                : '0px';

        if (isMobile) {
            return {
                height,
                left: 0,
                position: 'absolute',
                top: topOffset,
                transition: {
                    delay: 0.1,
                    duration: 0.5,
                    ease: 'easeInOut',
                },
                width: '100vw',
                y: 0,
            };
        }
        return {
            height,
            left: 0,
            position: 'absolute',
            top: 0,
            transition: {
                delay: 0.1,
                duration: 0.5,
                ease: 'easeInOut',
            },
            width: '100vw',
            y: 0,
        };
    },
};

interface VisualizerContainerProps {
    children: ReactNode;
    isMobile?: boolean;
    windowBarStyle: Platform;
}

const VisualizerContainer = memo(
    ({ children, isMobile, windowBarStyle }: VisualizerContainerProps) => {
        return (
            <motion.div
                animate="open"
                className={styles.container}
                custom={{ isMobile, windowBarStyle }}
                exit="closed"
                initial="closed"
                transition={{ duration: 2 }}
                variants={containerVariants}
            >
                {children}
            </motion.div>
        );
    },
);

VisualizerContainer.displayName = 'VisualizerContainer';

export const FullScreenVisualizer = () => {
    const { setStore } = useFullScreenPlayerStoreActions();
    const { windowBarStyle } = useWindowSettings();
    const { webAudio } = usePlaybackSettings();
    const visualizerType = useSettingsStore((store) => store.visualizer.type);
    const isMobile = useIsMobile();

    const location = useLocation();
    const isOpenedRef = useRef<boolean | null>(null);

    const handleCloseVisualizer = () => {
        setStore({ visualizerExpanded: false });
    };

    useHotkeys([['Escape', handleCloseVisualizer]]);

    useLayoutEffect(() => {
        if (isOpenedRef.current !== null) {
            setStore({ visualizerExpanded: false });
        }

        isOpenedRef.current = true;
    }, [location, setStore]);

    return (
        <VisualizerContainer isMobile={isMobile} windowBarStyle={windowBarStyle}>
            <div className={styles.visualizerContainer}>
                {webAudio ? (
                    <Suspense fallback={<></>}>
                        {visualizerType === 'butterchurn' ? (
                            <ButterchurnVisualizer />
                        ) : (
                            <AudioMotionAnalyzerVisualizer />
                        )}
                    </Suspense>
                ) : null}
                <FullScreenVisualizerSongInfo />
            </div>
        </VisualizerContainer>
    );
};
