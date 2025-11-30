import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { createRef, useEffect, useState } from 'react';

import styles from './visualizer.module.css';

import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { useSettingsStore } from '/@/renderer/store';

export const Visualizer = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLDivElement>();
    const accent = useSettingsStore((store) => store.general.accent);
    const [motion, setMotion] = useState<AudioMotionAnalyzer>();

    useEffect(() => {
        const { context, gains } = webAudio || {};
        if (gains && context && canvasRef.current && !motion) {
            const audioMotion = new AudioMotionAnalyzer(canvasRef.current, {
                ansiBands: true,
                audioCtx: context,
                connectSpeakers: false,
                gradient: 'prism',
                mode: 4,
                overlay: true,
                showBgColor: false,
                showPeaks: false,
                smoothing: 0.8,
            });
            setMotion(audioMotion);
            for (const gain of gains) audioMotion.connectInput(gain);
        }

        return () => {};
    }, [accent, canvasRef, motion, webAudio]);

    return <div className={styles.container} ref={canvasRef} />;
};
