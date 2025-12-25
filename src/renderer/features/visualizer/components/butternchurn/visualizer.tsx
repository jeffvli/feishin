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
    const [visualizer, setVisualizer] = useState<ButterchurnVisualizer>();
    const animationFrameRef = useRef<number | undefined>(undefined);
    const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);
    const cycleTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const cycleStartTimeRef = useRef<number | undefined>(undefined);
    const butterchurnSettings = useSettingsStore((store) => store.visualizer.butterchurn);
    const { setSettings } = useSettingsStoreActions();
    const playerStatus = usePlayerStatus();
    const isPlaying = playerStatus === PlayerStatus.PLAYING;

    useEffect(() => {
        const { context, gains } = webAudio || {};
        if (
            context &&
            gains &&
            canvasRef.current &&
            containerRef.current &&
            !visualizer &&
            isPlaying
        ) {
            const canvas = canvasRef.current;
            const container = containerRef.current;

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
                if (!gains || gains.length === 0) return;

                canvas.width = width;
                canvas.height = height;

                try {
                    const butterchurnInstance = butterchurn.createVisualizer(context, canvas, {
                        height,
                        width,
                    }) as ButterchurnVisualizer;

                    // Connect to audio gains (use the first gain node)
                    butterchurnInstance.connectAudio(gains[0]);

                    // Load preset from settings or default
                    const presets = butterchurnPresets.getPresets();
                    const presetNames = Object.keys(presets);

                    if (presetNames.length > 0) {
                        const presetName =
                            butterchurnSettings.currentPreset &&
                            presets[butterchurnSettings.currentPreset]
                                ? butterchurnSettings.currentPreset
                                : presetNames[0];
                        const preset = presets[presetName];
                        butterchurnInstance.loadPreset(
                            preset,
                            butterchurnSettings.blendTime || 0.0,
                        );
                        // Initialize cycle timer
                        cycleStartTimeRef.current = Date.now();
                    }

                    setVisualizer(butterchurnInstance);
                } catch (error) {
                    console.error('Failed to create butterchurn visualizer:', error);
                }
            }
        }

        return () => {};
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webAudio, canvasRef, containerRef, visualizer, isPlaying]);

    // Handle resize
    useEffect(() => {
        const container = containerRef.current;
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
        };
    }, [visualizer, containerRef, canvasRef]);

    // Update preset when currentPreset or blendTime changes (but not when cycling)
    const isCyclingRef = useRef(false);

    useEffect(() => {
        if (!visualizer || !butterchurnSettings.currentPreset) return;

        // Skip if we're currently cycling (to avoid recreating the visualizer)
        if (isCyclingRef.current) {
            isCyclingRef.current = false;
            return;
        }

        const presets = butterchurnPresets.getPresets();
        const preset = presets[butterchurnSettings.currentPreset];

        if (preset) {
            visualizer.loadPreset(preset, butterchurnSettings.blendTime || 0.0);
            // Reset cycle timer when preset changes manually
            cycleStartTimeRef.current = Date.now();
        }
    }, [visualizer, butterchurnSettings.currentPreset, butterchurnSettings.blendTime]);

    // Handle preset cycling
    useEffect(() => {
        if (!visualizer || !butterchurnSettings.cyclePresets) {
            // Clear cycle timer if cycling is disabled
            if (cycleTimerRef.current) {
                clearInterval(cycleTimerRef.current);
                cycleTimerRef.current = undefined;
            }
            return;
        }

        const presets = butterchurnPresets.getPresets();
        const allPresetNames = Object.keys(presets);

        // Get the list of presets to cycle through
        const presetList = butterchurnSettings.includeAllPresets
            ? allPresetNames
            : butterchurnSettings.selectedPresets.length > 0
              ? butterchurnSettings.selectedPresets.filter((name) => presets[name])
              : allPresetNames;

        if (presetList.length === 0) return;

        // Reset cycle timer when settings change
        cycleStartTimeRef.current = Date.now();

        const cycleToNextPreset = () => {
            if (!visualizer) return;

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
                visualizer.loadPreset(nextPreset, currentSettings.blendTime || 0.0);

                // Update currentPreset in settings
                const currentVisualizer = useSettingsStore.getState().visualizer;
                setSettings({
                    visualizer: {
                        ...currentVisualizer,
                        butterchurn: {
                            ...currentVisualizer.butterchurn,
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
    }, [visualizer, butterchurnSettings, setSettings]);

    useEffect(() => {
        if (!visualizer) return;

        let lastFrameTime = 0;
        const maxFPS = butterchurnSettings.maxFPS;
        const minFrameInterval = maxFPS > 0 ? 1000 / maxFPS : 0;

        const render = (currentTime: number) => {
            if (maxFPS === 0 || currentTime - lastFrameTime >= minFrameInterval) {
                visualizer.render();
                lastFrameTime = currentTime;
            }
            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [visualizer, butterchurnSettings.maxFPS]);

    return (
        <div className={styles.container} ref={containerRef}>
            <ActionIcon
                className={styles.settingsIcon}
                icon="settings2"
                iconProps={{ size: 'lg' }}
                onClick={openVisualizerSettingsModal}
                pos="absolute"
                right={0}
                top={0}
                variant="transparent"
            />
            <canvas className={styles.canvas} ref={canvasRef} />
            {butterchurnSettings.currentPreset && (
                <Text className={styles['preset-overlay']} isNoSelect size="sm">
                    {butterchurnSettings.currentPreset}
                </Text>
            )}
        </div>
    );
};

export const Visualizer = () => {
    return (
        <ComponentErrorBoundary>
            <VisualizerInner />
        </ComponentErrorBoundary>
    );
};
