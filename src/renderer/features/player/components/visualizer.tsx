import { createRef, useCallback, useEffect, useState } from 'react';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import styled from 'styled-components';
import { useSettingsStore } from '/@/renderer/store';

const StyledContainer = styled.div`
    max-width: 100%;
    margin: auto;

    canvas {
        width: 100%;
        margin: auto;
    }
`;

export const Visualizer = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLDivElement>();
    const accent = useSettingsStore((store) => store.general.accent);
    const [motion, setMotion] = useState<AudioMotionAnalyzer>();

    const [length, setLength] = useState(500);

    useEffect(() => {
        const { context, gain } = webAudio || {};
        if (gain && context && canvasRef.current && !motion) {
            const audioMotion = new AudioMotionAnalyzer(canvasRef.current, {
                ansiBands: true,
                audioCtx: context,
                connectSpeakers: false,
                gradient: 'prism',
                mode: 4,
                showPeaks: false,
                smoothing: 0.8,
            });
            setMotion(audioMotion);
            audioMotion.connectInput(gain);
        }

        return () => {};
    }, [accent, canvasRef, motion, webAudio]);

    const resize = useCallback(() => {
        const body = document.querySelector('.full-screen-player-queue-container');
        const header = document.querySelector('.full-screen-player-queue-header');

        if (body && header) {
            const width = body.clientWidth - 30;
            const height = body.clientHeight - header.clientHeight - 30;

            setLength(Math.min(width, height));
        }
    }, []);

    useEffect(() => {
        resize();

        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, [resize]);

    return (
        <StyledContainer
            ref={canvasRef}
            style={{ height: length, width: length }}
        />
    );
};
