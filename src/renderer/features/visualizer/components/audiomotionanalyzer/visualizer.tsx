import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from './visualizer.module.css';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { getVisualizerAudioNodes } from '/@/renderer/features/player/utils/get-visualizer-audio-nodes';
import { openVisualizerSettingsModal } from '/@/renderer/features/player/utils/open-visualizer-settings-modal';
import { ComponentErrorBoundary } from '/@/renderer/features/shared/components/component-error-boundary';
import { useAccent, usePlaybackType, useSettingsStore } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { usePlayerStatus } from '/@/renderer/store/player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

const VisualizerInner = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLDivElement>();
    const accent = useAccent();
    const visualizer = useSettingsStore((store) => store.visualizer);
    const playbackType = usePlaybackType();
    const opacity = useSettingsStore((store) => store.visualizer.audiomotionanalyzer.opacity);
    const [motion, setMotion] = useState<any>();
    const [libraryLoaded, setLibraryLoaded] = useState(false);
    const AudioMotionAnalyzerRef = useRef<any>(null);
    const pauseTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const playerStatus = usePlayerStatus();
    const isPlaying = playerStatus === PlayerStatus.PLAYING;

    useEffect(() => {
        let isMounted = true;

        const loadLibrary = async () => {
            try {
                const module = await import('audiomotion-analyzer');
                if (isMounted) {
                    AudioMotionAnalyzerRef.current = module.default;
                    setLibraryLoaded(true);
                }
            } catch (error) {
                console.error('Failed to load AudioMotionAnalyzer library:', error);
            }
        };

        loadLibrary();

        return () => {
            isMounted = false;
        };
    }, []);

    // Check if a gradient name is a custom gradient
    const isCustomGradient = useCallback(
        (gradientName: string | undefined): boolean => {
            if (!gradientName || visualizer.type !== 'audiomotionanalyzer') {
                return false;
            }

            const customGradients = visualizer.audiomotionanalyzer.customGradients || [];
            return customGradients.some((gradient) => gradient.name === gradientName);
        },
        [visualizer],
    );

    const [gradientsRegistered, setGradientsRegistered] = useState(false);

    const options = useMemo(() => {
        if (visualizer.type !== 'audiomotionanalyzer') {
            return {};
        }

        const ama = visualizer.audiomotionanalyzer;

        const defaults = {
            bgAlpha: 0,
            showBgColor: false,
        };

        const gradients: { gradient?: string; gradientLeft?: string; gradientRight?: string } = {};

        // Use default gradient if custom gradient is selected but not yet registered
        const getSafeGradient = (gradientName: string | undefined): string => {
            if (!gradientName) return 'classic';
            if (isCustomGradient(gradientName)) {
                // Use default until custom gradients are registered
                return gradientsRegistered ? gradientName : 'classic';
            }
            return gradientName;
        };

        if (ama.channelLayout === 'single') {
            gradients.gradient = getSafeGradient(ama.gradient);
        } else {
            gradients.gradientLeft = getSafeGradient(ama.gradientLeft);
            gradients.gradientRight = getSafeGradient(ama.gradientRight);
        }

        return {
            ...defaults,
            ...gradients,
            alphaBars: ama.alphaBars,
            ansiBands: ama.ansiBands,
            barSpace: ama.barSpace,
            channelLayout: ama.channelLayout,
            colorMode: ama.colorMode,
            connectSpeakers: false,
            fadePeaks: ama.fadePeaks,
            fftSize: ama.fftSize,
            fillAlpha: ama.fillAlpha,
            frequencyScale: ama.frequencyScale,
            gravity: ama.gravity,
            ledBars: ama.ledBars,
            linearAmplitude: ama.linearAmplitude,
            linearBoost: ama.linearBoost,
            lineWidth: ama.lineWidth,
            loRes: ama.loRes,
            lumiBars: ama.lumiBars,
            maxDecibels: ama.maxDecibels,
            maxFPS: ama.maxFPS,
            maxFreq: ama.maxFreq,
            minDecibels: ama.minDecibels,
            minFreq: ama.minFreq,
            mirror: ama.mirror,
            mode: ama.mode,
            noteLabels: ama.noteLabels,
            outlineBars: ama.outlineBars,
            overlay: true,
            peakFadeTime: ama.peakFadeTime,
            peakHoldTime: ama.peakHoldTime,
            peakLine: ama.peakLine,
            radial: ama.radial,
            radialInvert: ama.radialInvert,
            radius: ama.radius,
            reflexAlpha: ama.reflexAlpha,
            reflexBright: ama.reflexBright,
            reflexFit: ama.reflexFit,
            reflexRatio: ama.reflexRatio,
            roundBars: ama.roundBars,
            showFPS: ama.showFPS,
            showPeaks: ama.showPeaks,
            showScaleX: ama.showScaleX,
            showScaleY: ama.showScaleY,
            smoothing: ama.smoothing,
            spinSpeed: ama.spinSpeed,
            splitGradient: ama.splitGradient,
            trueLeds: ama.trueLeds,
            volume: ama.volume,
            weightingFilter: (ama.weightingFilter || '') as any,
        };
    }, [visualizer, gradientsRegistered, isCustomGradient]);

    const transformGradientForVisualizer = useCallback(
        (gradient: {
            colorStops: Array<{
                color: string;
                level?: number;
                levelEnabled?: boolean;
                pos?: number;
                positionEnabled?: boolean;
            }>;
            dir?: string;
        }): {
            colorStops: (string | { color: string; level?: number; pos?: number })[];
            dir?: string;
        } => {
            const transformedColorStops = gradient.colorStops.map((stop) => {
                // If neither position nor level is enabled, return just the color string
                if (!stop.positionEnabled && !stop.levelEnabled) {
                    return stop.color;
                }

                // Otherwise, return an object with only enabled properties
                const transformedStop: { color: string; level?: number; pos?: number } = {
                    color: stop.color,
                };

                if (stop.positionEnabled && stop.pos !== undefined) {
                    transformedStop.pos = stop.pos;
                }

                if (stop.levelEnabled && stop.level !== undefined) {
                    transformedStop.level = stop.level;
                }

                return transformedStop;
            });

            return {
                colorStops: transformedColorStops,
                ...(gradient.dir ? { dir: gradient.dir } : {}),
            };
        },
        [],
    );

    const registerCustomGradients = useCallback(
        (audioMotionInstance: any) => {
            if (visualizer.type !== 'audiomotionanalyzer') {
                return;
            }

            const customGradients = visualizer.audiomotionanalyzer.customGradients || [];

            customGradients.forEach((gradient) => {
                try {
                    const gradientConfig = transformGradientForVisualizer(gradient);

                    audioMotionInstance.registerGradient(gradient.name, gradientConfig as any);
                } catch (error) {
                    console.error(`Failed to register gradient "${gradient.name}":`, error);
                }
            });

            // Mark gradients as registered
            setGradientsRegistered(true);
        },
        [visualizer, transformGradientForVisualizer],
    );

    useEffect(() => {
        const { context } = webAudio || {};
        const inputNodes = getVisualizerAudioNodes(webAudio, playbackType);
        const shouldRunForWebPlayback = playbackType === PlayerType.WEB && isPlaying;
        const shouldRunForMpvLoopback =
            playbackType === PlayerType.LOCAL && isPlaying && inputNodes.length > 0;

        let audioMotion: any | undefined;
        if (
            inputNodes.length > 0 &&
            context &&
            canvasRef.current &&
            !motion &&
            libraryLoaded &&
            (shouldRunForWebPlayback || shouldRunForMpvLoopback)
        ) {
            const AudioMotionAnalyzer = AudioMotionAnalyzerRef.current;
            if (!AudioMotionAnalyzer) return;

            // Reset gradients registered flag on new instance
            setGradientsRegistered(false);

            // Create options without custom gradients on first init
            const initOptions: any = { ...options };

            // Replace custom gradients with default 'classic' for initial setup
            if (visualizer.type === 'audiomotionanalyzer') {
                const ama = visualizer.audiomotionanalyzer;
                if (isCustomGradient(ama.gradient)) {
                    initOptions.gradient = 'classic';
                }
                if (isCustomGradient(ama.gradientLeft)) {
                    initOptions.gradientLeft = 'classic';
                }
                if (isCustomGradient(ama.gradientRight)) {
                    initOptions.gradientRight = 'classic';
                }
            }

            audioMotion = new AudioMotionAnalyzer(canvasRef.current, {
                ...initOptions,
                audioCtx: context,
            });

            // Register custom gradients (this will set gradientsRegistered to true)
            registerCustomGradients(audioMotion);

            setMotion(audioMotion);
            for (const node of inputNodes) audioMotion.connectInput(node);
        }

        return () => {
            if (motion) {
                try {
                    motion.destroy();
                } catch {
                    // ignore (e.g. already destroyed by idle timer)
                }
                setMotion(undefined);
            }
        };
    }, [
        accent,
        canvasRef,
        registerCustomGradients,
        playbackType,
        webAudio,
        visualizer,
        options,
        isCustomGradient,
        motion,
        libraryLoaded,
        isPlaying,
    ]);

    // Kill visualizer after 5 seconds of pause
    useEffect(() => {
        if (isPlaying) {
            if (pauseTimerRef.current) {
                clearTimeout(pauseTimerRef.current);
                pauseTimerRef.current = undefined;
            }
            return;
        }

        if (!motion) return;

        pauseTimerRef.current = setTimeout(() => {
            setMotion((current) => {
                if (current) {
                    try {
                        current.destroy();
                    } catch {
                        // ignore
                    }
                }
                return undefined;
            });
            pauseTimerRef.current = undefined;
        }, 5000);

        return () => {
            if (pauseTimerRef.current) {
                clearTimeout(pauseTimerRef.current);
                pauseTimerRef.current = undefined;
            }
        };
    }, [isPlaying, motion]);

    // Re-register custom gradients when they change
    useEffect(() => {
        if (motion && visualizer.type === 'audiomotionanalyzer') {
            setGradientsRegistered(false);
            registerCustomGradients(motion);
        }
    }, [
        motion,
        registerCustomGradients,
        visualizer.audiomotionanalyzer.customGradients,
        visualizer.type,
    ]);

    // Update visualizer settings when they change
    useEffect(() => {
        if (motion) {
            motion.setOptions(options);
        }
    }, [motion, options]);

    return <div className={styles.visualizer} ref={canvasRef} style={{ opacity }} />;
};

export const Visualizer = () => {
    const { visualizerExpanded } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();

    const handleToggleFullscreen = () => {
        setStore({ expanded: false, visualizerExpanded: !visualizerExpanded });
    };

    return (
        <div className={styles.container}>
            <Group
                className={styles.iconGroup}
                gap="xs"
                pos="absolute"
                right="var(--theme-spacing-sm)"
                top="var(--theme-spacing-sm)"
            >
                <ActionIcon
                    icon="expand"
                    iconProps={{ size: 'lg' }}
                    onClick={handleToggleFullscreen}
                    variant="subtle"
                />
                <ActionIcon
                    icon="settings2"
                    iconProps={{ size: 'lg' }}
                    onClick={openVisualizerSettingsModal}
                    variant="subtle"
                />
            </Group>
            <ComponentErrorBoundary>
                <VisualizerInner />
            </ComponentErrorBoundary>
        </div>
    );
};
