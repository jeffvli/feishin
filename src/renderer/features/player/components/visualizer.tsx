import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { createRef, useEffect, useMemo, useState } from 'react';

import styles from './visualizer.module.css';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { openVisualizerSettingsModal } from '/@/renderer/features/player/utils/open-visualizer-settings-modal';
import { useSettingsStore } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const Visualizer = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLDivElement>();
    const accent = useSettingsStore((store) => store.general.accent);
    const visualizer = useSettingsStore((store) => store.visualizer);
    const [motion, setMotion] = useState<AudioMotionAnalyzer>();

    const options = useMemo(() => {
        if (visualizer.type !== 'audiomotionanalyzer') {
            return {};
        }

        const ama = visualizer.audiomotionanalyzer;
        return {
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
            gradient: ama.gradient,
            gradientLeft: ama.gradientLeft,
            gradientRight: ama.gradientRight,
            gravity: ama.gravity,
            ledBars: ama.ledBars,
            linearAmplitude: ama.linearAmplitude,
            linearBoost: ama.linearBoost,
            lineWidth: ama.lineWidth,
            loRes: ama.loRes,
            lumiBars: ama.lumiBars,
            maxDecibels: ama.maxDecibels,
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
            showBgColor: ama.showBgColor,
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
    }, [visualizer]);

    console.log(options);

    useEffect(() => {
        const { context, gains } = webAudio || {};
        if (gains && context && canvasRef.current && !motion) {
            const audioMotion = new AudioMotionAnalyzer(canvasRef.current, {
                ...options,
                audioCtx: context,
            });

            setMotion(audioMotion);
            for (const gain of gains) audioMotion.connectInput(gain);
        }

        return () => {};
    }, [accent, canvasRef, motion, webAudio, visualizer, options]);

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
