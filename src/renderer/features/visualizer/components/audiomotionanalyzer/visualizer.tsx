import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { createRef, useCallback, useEffect, useMemo, useState } from 'react';

import styles from './visualizer.module.css';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { openVisualizerSettingsModal } from '/@/renderer/features/player/utils/open-visualizer-settings-modal';
import { ComponentErrorBoundary } from '/@/renderer/features/shared/components/component-error-boundary';
import { useSettingsStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

const VisualizerInner = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLDivElement>();
    const accent = useSettingsStore((store) => store.general.accent);
    const visualizer = useSettingsStore((store) => store.visualizer);
    const [motion, setMotion] = useState<AudioMotionAnalyzer>();

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

    const registerCustomGradients = useCallback(
        (audioMotionInstance: AudioMotionAnalyzer) => {
            if (visualizer.type !== 'audiomotionanalyzer') {
                return;
            }

            const customGradients = visualizer.audiomotionanalyzer.customGradients || [];

            customGradients.forEach((gradient) => {
                try {
                    const gradientConfig: {
                        colorStops: (string | { color: string; level?: number; pos?: number })[];
                        dir?: string;
                    } = {
                        colorStops: gradient.colorStops,
                    };

                    if (gradient.dir) {
                        gradientConfig.dir = gradient.dir;
                    }

                    // Type assertion needed as TypeScript definitions may be incomplete
                    audioMotionInstance.registerGradient(gradient.name, gradientConfig as any);
                } catch (error) {
                    console.error(`Failed to register gradient "${gradient.name}":`, error);
                }
            });

            // Mark gradients as registered
            setGradientsRegistered(true);
        },
        [visualizer],
    );

    useEffect(() => {
        const { context, gains } = webAudio || {};
        if (gains && context && canvasRef.current && !motion) {
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

            const audioMotion = new AudioMotionAnalyzer(canvasRef.current, {
                ...initOptions,
                audioCtx: context,
            });

            // Register custom gradients (this will set gradientsRegistered to true)
            registerCustomGradients(audioMotion);

            setMotion(audioMotion);
            for (const gain of gains) audioMotion.connectInput(gain);
        }

        return () => {};
    }, [
        accent,
        canvasRef,
        motion,
        registerCustomGradients,
        webAudio,
        visualizer,
        options,
        isCustomGradient,
    ]);

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

    return (
        <div className={styles.container}>
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
            <div className={styles.visualizer} ref={canvasRef} />
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
