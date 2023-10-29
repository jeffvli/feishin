import { createRef, useCallback, useEffect, useState } from 'react';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import styled from 'styled-components';
import { useSettingsStore } from '/@/renderer/store';

const StyledContainer = styled.div`
    margin: auto;
    max-width: 100%;

    canvas {
        margin: auto;
        width: 100%;
    }
`;

const CANVAS_SIZE = 510;
const TARGET_MAX_FREQUENCY = 20000;
const LOG_SCALING = 1.1;
const MIN_SAMPLE_FREQUENCY = 16;

export const Visualizer = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLCanvasElement>();
    const accent = useSettingsStore((store) => store.general.accent);

    const [length, setLength] = useState(500);

    useEffect(() => {
        const { analyzer, context } = webAudio || {};
        if (analyzer && context && canvasRef.current) {
            const canvasCtx = canvasRef.current.getContext('2d');

            if (!canvasCtx) {
                return () => {};
            }

            const rgb = accent.substring(4, accent.length - 1);
            analyzer.fftSize = 2048;

            const sampleWidth = context.sampleRate / analyzer.fftSize;
            const numSamplesInRange = Math.ceil(TARGET_MAX_FREQUENCY / sampleWidth);
            const samples: Array<number> = [];

            for (let i = 1; i <= numSamplesInRange; i *= LOG_SCALING) {
                const position = Math.round(i) - 1;
                if (
                    (position + 0.5) * sampleWidth >= MIN_SAMPLE_FREQUENCY &&
                    position !== samples[samples.length - 1]
                ) {
                    samples.push(position);
                }
            }

            const totalNumBars = samples.length;
            const currentDataArray = new Uint8Array(numSamplesInRange);
            const barWidth = Math.floor(CANVAS_SIZE / totalNumBars) - 2;

            const draw = setInterval(() => {
                analyzer.getByteFrequencyData(currentDataArray);

                canvasCtx.clearRect(0, CANVAS_SIZE / 4, CANVAS_SIZE, (CANVAS_SIZE / 4) * 3);

                let barHeight;
                let x = 0;

                for (const position of samples) {
                    barHeight = currentDataArray[position];

                    canvasCtx.fillStyle = `rgba(${rgb}, ${(barHeight + 75) / 255})`;
                    canvasCtx.fillRect(x, CANVAS_SIZE - barHeight * 1.5, barWidth, barHeight * 1.5);

                    x += barWidth + 2;
                }
            }, 60);

            return () => {
                clearInterval(draw);
            };
        }

        return () => {};
    }, [accent, canvasRef, webAudio]);

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
        <StyledContainer style={{ height: length, width: length }}>
            <canvas
                ref={canvasRef}
                height={CANVAS_SIZE}
                width={CANVAS_SIZE}
            />
        </StyledContainer>
    );
};
