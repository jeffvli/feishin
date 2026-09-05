import clsx from 'clsx';
import { motion } from 'motion/react';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { useMusicVideoPip } from '../hooks/use-music-video-pip';
import { useMusicVideoPlaceholder } from '../hooks/use-music-video-placeholder';
import { useMusicVideoPrefetch } from '../hooks/use-music-video-prefetch';
import { useMusicVideoSync } from '../hooks/use-music-video-sync';
import styles from './music-video-host.module.css';

import { VIDEO_FULLSCREEN_TARGET_ID } from '/@/renderer/hooks/use-fullscreen-toggle';
import { useGeneralSettings, useSettingsStore } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

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

// Long enough to read as one surface rising over another, short enough not to sit in front of the
// video. Only `transform` is animated: the panel used to animate `top` and `height`, which relaid
// out and repainted a decoding video on every frame of the open, and that was a large part of why
// it arrived stuttering.
const OPEN_TRANSITION = { duration: 0.42, ease: [0.32, 0.72, 0, 1] } as const;

/**
 * The music video surface: one `<video>` element that lives for as long as the feature is enabled,
 * shown by sliding a panel over the main content and hidden by sliding it back. Everything behind
 * it - the lookup, the download, the drift correction, the placeholder stream - is switched off
 * while the panel is closed and no picture-in-picture window is open.
 *
 * Deliberately not a tab in the full-screen player. It was one, which meant the panel mounted a
 * second time to go full screen and unmounted the copy the picture-in-picture window was bound to.
 */
const MusicVideoSurface = () => {
    const { t } = useTranslation();
    const { musicVideoFallback } = useGeneralSettings();
    const visualizerType = useSettingsStore((state) => state.visualizer.type);
    const videoExpanded = useFullScreenPlayerStore((state) => state.videoExpanded);
    const { setStore } = useFullScreenPlayerStoreActions();

    const videoRef = useRef<HTMLVideoElement>(null);
    const { isPipActive, isSupported: isPipSupported, requestPip } = useMusicVideoPip(videoRef);

    // A picture-in-picture window is a second way of watching, so it keeps the whole pipeline
    // running even with the panel closed - that is the point of popping it out.
    const isActive = videoExpanded || isPipActive;

    const { isLoading, isVideoReady, loadingStatus, match } = useMusicVideoSync(videoRef, isActive);
    useMusicVideoPrefetch(isActive, isVideoReady);

    const hasMatch = Boolean(match?.videoId && !match.noMatch && isVideoReady);
    // `isLoading` covers the search/score phase and, separately, the per-candidate download -
    // it briefly goes false in between the two (the lookup's own `finally` clears it before the
    // download effect gets a chance to set it again), which would otherwise flash the "no video
    // found" fallback for a frame even though a match was just found and is about to download.
    const isResolving = isLoading || Boolean(match?.videoId && !match.noMatch && !isVideoReady);

    const noVideoLabel = t('page.fullscreenPlayer.noMusicVideo');
    useMusicVideoPlaceholder(
        videoRef,
        hasMatch ? 'none' : isResolving ? 'loading' : 'unavailable',
        hasMatch ? '' : isResolving ? (loadingStatus ?? '') : noVideoLabel,
        isActive,
    );

    const location = useLocation();

    useEffect(() => {
        if (!videoExpanded) return;

        const close = () => setStore({ videoExpanded: false });

        const onKeyDown = (event: KeyboardEvent) => {
            // While the stage is browser-fullscreen, Escape is the platform's own "leave
            // fullscreen" gesture and closing the panel underneath it would be a second,
            // unasked-for action on one keypress.
            if (event.key !== 'Escape' || document.fullscreenElement) return;
            close();
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoExpanded]);

    // Navigating somewhere else is a request to look at that page, not at a video panel covering
    // it. The first run is skipped by depending on `location` alone: it fires on mount, when the
    // panel has not been opened by anything yet.
    const navigatedRef = useRef(false);
    useEffect(() => {
        if (navigatedRef.current) setStore({ videoExpanded: false });
        navigatedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {
                    // Nothing to do if the browser already left fullscreen on its own.
                });
            }
        };
    }, []);

    return (
        <div className={styles.host}>
            <motion.div
                animate={{ y: videoExpanded ? '0%' : '100%' }}
                className={clsx(styles.panel, { [styles.panelOpen]: videoExpanded })}
                initial={false}
                transition={OPEN_TRANSITION}
            >
                <div className={styles.stage} id={VIDEO_FULLSCREEN_TARGET_ID}>
                    <div
                        className={styles.videoLayer}
                        style={{ visibility: hasMatch ? 'visible' : 'hidden' }}
                    >
                        <video className={styles.video} muted playsInline ref={videoRef} />
                    </div>
                    {!hasMatch && (
                        <div className={styles.fallback}>
                            {isResolving ? (
                                <Center h="100%" w="100%">
                                    <Stack align="center" gap="xs">
                                        <Spinner size="xl" />
                                        {loadingStatus && (
                                            <Text isMuted size="md">
                                                {loadingStatus}
                                            </Text>
                                        )}
                                    </Stack>
                                </Center>
                            ) : musicVideoFallback === 'visualizer' ? (
                                <Suspense fallback={<></>}>
                                    {visualizerType === 'butterchurn' ? (
                                        <ButterchurnVisualizer />
                                    ) : (
                                        <AudioMotionAnalyzerVisualizer />
                                    )}
                                </Suspense>
                            ) : (
                                <Center h="100%" w="100%">
                                    <Stack align="center" gap="xs">
                                        <Icon color="muted" icon="video" size="3rem" />
                                        <Text isMuted size="md">
                                            {noVideoLabel}
                                        </Text>
                                    </Stack>
                                </Center>
                            )}
                        </div>
                    )}
                    <Group className={styles.chrome} gap="xs">
                        {isPipSupported && !isPipActive && (
                            <ActionIcon
                                icon="pictureInPicture"
                                iconProps={{ size: 'lg' }}
                                onClick={() => requestPip()}
                                tooltip={{ label: t('page.fullscreenPlayer.pictureInPicture') }}
                                variant="subtle"
                            />
                        )}
                        <ActionIcon
                            icon="x"
                            iconProps={{ size: 'lg' }}
                            onClick={() => setStore({ videoExpanded: false })}
                            tooltip={{ label: t('common.close') }}
                            variant="subtle"
                        />
                    </Group>
                </div>
            </motion.div>
        </div>
    );
};

export const MusicVideoHost = () => {
    const { musicVideoEnabled } = useGeneralSettings();

    return musicVideoEnabled ? <MusicVideoSurface /> : null;
};
