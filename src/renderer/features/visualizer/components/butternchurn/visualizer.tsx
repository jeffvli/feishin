import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { createRef, useEffect, useRef, useState } from 'react';

import styles from './visualizer.module.css';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { openVisualizerSettingsModal } from '/@/renderer/features/player/utils/open-visualizer-settings-modal';
import { ComponentErrorBoundary } from '/@/renderer/features/shared/components/component-error-boundary';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { usePlayerStatus } from '/@/renderer/store/player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Text } from '/@/shared/components/text/text';
import { PlayerStatus } from '/@/shared/types/types';

type ButterchurnVisualizer = {
    connectAudio: (audioNode: AudioNode) => void;
    loadPreset: (preset: any, blendTime: number) => void;
    render: () => void;
    setRendererSize: (width: number, height: number) => void;
};

const VisualizerInner = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLCanvasElement>();
    const containerRef = createRef<HTMLDivElement>();
    const visualizerRef = useRef<ButterchurnVisualizer | undefined>(undefined);
    const isInitializedRef = useRef(false);
    const [isVisualizerReady, setIsVisualizerReady] = useState(false);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);
    const cycleTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const cycleStartTimeRef = useRef<number | undefined>(undefined);
    const pauseTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const initialPresetLoadedRef = useRef(false);
    const butterchurnSettings = useSettingsStore((store) => store.visualizer.butterchurn);
    const opacity = useSettingsStore((store) => store.visualizer.butterchurn.opacity);
    const { setSettings } = useSettingsStoreActions();
    const playerStatus = usePlayerStatus();
    const isPlaying = playerStatus === PlayerStatus.PLAYING;

    const cleanupVisualizer = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }

        if (cycleTimerRef.current) {
            clearInterval(cycleTimerRef.current);
            cycleTimerRef.current = undefined;
        }

        if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = undefined;
        }

        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = undefined;
        }

        visualizerRef.current = undefined;
        isInitializedRef.current = false;
        initialPresetLoadedRef.current = false;
        setIsVisualizerReady(false);
    };

    // Initialize butterchurn instance
    useEffect(() => {
        const { context, gains } = webAudio || {};
        const canvas = canvasRef.current;
        const container = containerRef.current;

        const needsInitialization =
            context &&
            gains &&
            gains.length > 0 &&
            canvas &&
            container &&
            isPlaying &&
            (!isInitializedRef.current || !visualizerRef.current);

        if (!needsInitialization) {
            return;
        }

        const getDimensions = () => {
            const rect = container.getBoundingClientRect();
            return {
                height: rect.height || 600,
                width: rect.width || 800,
            };
        };

        let dimensions = getDimensions();

        // If dimensions are 0, wait for next frame
        if (dimensions.width === 0 || dimensions.height === 0) {
            requestAnimationFrame(() => {
                dimensions = getDimensions();
                if (dimensions.width > 0 && dimensions.height > 0) {
                    initializeVisualizer(dimensions.width, dimensions.height);
                }
            });
        } else {
            initializeVisualizer(dimensions.width, dimensions.height);
        }

        function initializeVisualizer(width: number, height: number) {
            if (!gains || gains.length === 0 || !canvas || !context) return;

            canvas.width = width;
            canvas.height = height;

            try {
                const butterchurnInstance = butterchurn.createVisualizer(context, canvas, {
                    height,
                    width,
                }) as ButterchurnVisualizer;

                for (const gain of gains) {
                    butterchurnInstance.connectAudio(gain);
                }

                visualizerRef.current = butterchurnInstance;
                isInitializedRef.current = true;
                setIsVisualizerReady(true);
            } catch (error) {
                console.error('Failed to create butterchurn visualizer:', error);
                isInitializedRef.current = false;
                visualizerRef.current = undefined;
            }
        }

        return () => {
            // Cleanup on unmount or when webAudio changes
            cleanupVisualizer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webAudio, isPlaying]);

    // Kill visualizer after 5 seconds of pause
    useEffect(() => {
        if (isPlaying) {
            // Clear pause timer if player resumes
            if (pauseTimerRef.current) {
                clearTimeout(pauseTimerRef.current);
                pauseTimerRef.current = undefined;
            }
            return;
        }

        // Player is paused
        if (!visualizerRef.current) return;

        // Start 5-second timer
        pauseTimerRef.current = setTimeout(() => {
            cleanupVisualizer();
            pauseTimerRef.current = undefined;
        }, 5000);

        return () => {
            if (pauseTimerRef.current) {
                clearTimeout(pauseTimerRef.current);
                pauseTimerRef.current = undefined;
            }
        };
    }, [isPlaying]);

    // Handle resize
    useEffect(() => {
        const container = containerRef.current;
        const visualizer = visualizerRef.current;
        if (!container || !visualizer) return;

        const handleResize = () => {
            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (canvasRef.current) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
            }

            visualizer.setRendererSize(width, height);
        };

        resizeObserverRef.current = new ResizeObserver(handleResize);
        resizeObserverRef.current.observe(container);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = undefined;
            }
        };
    }, [isVisualizerReady, canvasRef, containerRef]);

    // Load initial preset when visualizer is ready
    useEffect(() => {
        const visualizer = visualizerRef.current;
        if (!visualizer || !isVisualizerReady || initialPresetLoadedRef.current) return;

        const presets = butterchurnPresets;
        const presetNames = Object.keys(presets);

        if (presetNames.length > 0) {
            const presetName =
                butterchurnSettings.currentPreset && presets[butterchurnSettings.currentPreset]
                    ? butterchurnSettings.currentPreset
                    : presetNames[0];
            const preset = presets[presetName];

            if (preset) {
                visualizer.loadPreset(preset, butterchurnSettings.blendTime || 0.0);
                cycleStartTimeRef.current = Date.now();
                initialPresetLoadedRef.current = true;
            }
        }
    }, [isVisualizerReady, butterchurnSettings.currentPreset, butterchurnSettings.blendTime]);

    // Update preset when currentPreset or blendTime changes (but not when cycling)
    const isCyclingRef = useRef(false);

    useEffect(() => {
        const visualizer = visualizerRef.current;
        if (!visualizer || !butterchurnSettings.currentPreset || !initialPresetLoadedRef.current)
            return;

        // Skip if we're currently cycling (to avoid reloading preset)
        if (isCyclingRef.current) {
            isCyclingRef.current = false;
            return;
        }

        const presets = butterchurnPresets;
        const preset = presets[butterchurnSettings.currentPreset];

        if (preset) {
            visualizer.loadPreset(preset, butterchurnSettings.blendTime || 0.0);
            // Reset cycle timer when preset changes manually
            cycleStartTimeRef.current = Date.now();
        }
    }, [butterchurnSettings.currentPreset, butterchurnSettings.blendTime]);

    // Handle preset cycling
    useEffect(() => {
        const visualizer = visualizerRef.current;
        if (!visualizer || !butterchurnSettings.cyclePresets || !initialPresetLoadedRef.current) {
            // Clear cycle timer if cycling is disabled or visualizer not ready
            if (cycleTimerRef.current) {
                clearInterval(cycleTimerRef.current);
                cycleTimerRef.current = undefined;
            }
            return;
        }

        const presets = butterchurnPresets;
        const allPresetNames = Object.keys(presets);

        // Get the list of presets to cycle through
        let presetList = butterchurnSettings.includeAllPresets
            ? allPresetNames
            : butterchurnSettings.selectedPresets.length > 0
              ? butterchurnSettings.selectedPresets.filter((name) => presets[name])
              : allPresetNames;

        // Filter out ignored presets
        if (butterchurnSettings.ignoredPresets && butterchurnSettings.ignoredPresets.length > 0) {
            presetList = presetList.filter(
                (name) => !butterchurnSettings.ignoredPresets.includes(name),
            );
        }

        if (presetList.length === 0) return;

        // Reset cycle timer when settings change
        cycleStartTimeRef.current = Date.now();

        const cycleToNextPreset = () => {
            const currentVisualizer = visualizerRef.current;
            if (!currentVisualizer) return;

            const currentPresetName = butterchurnSettings.currentPreset;
            let nextPresetName: string;

            if (butterchurnSettings.randomizeNextPreset) {
                // Randomly select a preset (excluding current if there are multiple)
                const availablePresets =
                    presetList.length > 1
                        ? presetList.filter((name) => name !== currentPresetName)
                        : presetList;
                const randomIndex = Math.floor(Math.random() * availablePresets.length);
                nextPresetName = availablePresets[randomIndex];
            } else {
                // Cycle to next preset in order
                const currentIndex = currentPresetName ? presetList.indexOf(currentPresetName) : -1;
                const nextIndex =
                    currentIndex >= 0 && currentIndex < presetList.length - 1
                        ? currentIndex + 1
                        : 0;
                nextPresetName = presetList[nextIndex];
            }

            const nextPreset = presets[nextPresetName];
            if (nextPreset) {
                // Get current settings to ensure we use the latest blendTime
                const currentSettings = useSettingsStore.getState().visualizer.butterchurn;

                // Mark that we're cycling to prevent the preset change effect from running
                isCyclingRef.current = true;

                // Load the preset with blending
                currentVisualizer.loadPreset(nextPreset, currentSettings.blendTime || 0.0);

                // Update currentPreset in settings
                setSettings({
                    visualizer: {
                        butterchurn: {
                            currentPreset: nextPresetName,
                        },
                    },
                });

                cycleStartTimeRef.current = Date.now();
            }
        };

        // Check every second if it's time to cycle
        cycleTimerRef.current = setInterval(() => {
            if (cycleStartTimeRef.current === undefined) {
                cycleStartTimeRef.current = Date.now();
                return;
            }
            const elapsed = (Date.now() - cycleStartTimeRef.current) / 1000; // Convert to seconds
            if (elapsed >= butterchurnSettings.cycleTime) {
                cycleToNextPreset();
            }
        }, 1000);

        return () => {
            if (cycleTimerRef.current) {
                clearInterval(cycleTimerRef.current);
                cycleTimerRef.current = undefined;
            }
        };
    }, [
        isVisualizerReady,
        butterchurnSettings.cyclePresets,
        butterchurnSettings.cycleTime,
        butterchurnSettings.includeAllPresets,
        butterchurnSettings.selectedPresets,
        butterchurnSettings.ignoredPresets,
        butterchurnSettings.randomizeNextPreset,
        butterchurnSettings.currentPreset,
        setSettings,
    ]);

    useEffect(() => {
        const visualizer = visualizerRef.current;
        if (!visualizer || !isVisualizerReady) return;

        let lastFrameTime = 0;
        const maxFPS = butterchurnSettings.maxFPS;
        const minFrameInterval = maxFPS > 0 ? 1000 / maxFPS : 0;

        const render = (currentTime: number) => {
            const currentVisualizer = visualizerRef.current;
            if (!currentVisualizer) {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = undefined;
                }
                return;
            }

            if (maxFPS === 0 || currentTime - lastFrameTime >= minFrameInterval) {
                currentVisualizer.render();
                lastFrameTime = currentTime;
            }
            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = undefined;
            }
        };
    }, [isVisualizerReady, butterchurnSettings.maxFPS]);

    // Render container when playing (for initialization) or when visualizer exists
    // Canvas must always be rendered when container is rendered so refs are available
    const shouldRenderContainer = isPlaying || isVisualizerReady;

    if (!shouldRenderContainer) {
        return null;
    }

    return (
        <div
            className={styles.container}
            ref={containerRef}
            style={{ opacity: isVisualizerReady ? opacity : 0 }}
        >
            <canvas className={styles.canvas} ref={canvasRef} />
            {isVisualizerReady && butterchurnSettings.currentPreset && (
                <Text className={styles['preset-overlay']} isNoSelect size="sm">
                    {butterchurnSettings.currentPreset}
                </Text>
            )}
        </div>
    );
};

export const Visualizer = () => {
    return (
        <div className={styles.container}>
            <ActionIcon
                className={styles.settingsIcon}
                icon="settings2"
                iconProps={{ size: 'lg' }}
                onClick={openVisualizerSettingsModal}
                pos="absolute"
                right="var(--theme-spacing-sm)"
                top="var(--theme-spacing-sm)"
                variant="subtle"
            />
            <ComponentErrorBoundary>
                <VisualizerInner />
            </ComponentErrorBoundary>
        </div>
    );
};
