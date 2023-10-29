import { createRef, useCallback, useEffect, useState } from 'react';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import styled from 'styled-components';

const StyledContainer = styled.div`
    max-width: 100%;

    canvas {
        margin: auto;
        width: 100%;
    }
`;

const CANVAS_SIZE = 510;
const TARGET_MAX_FREQUENCY = 20000;
const LOG_SCALING = 1.5;

export const Visualizer = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLCanvasElement>();

    const [length, setLength] = useState(500);

    useEffect(() => {
        const { analyzer, context } = webAudio || {};
        if (analyzer && context && canvasRef.current) {
            const canvasCtx = canvasRef.current.getContext('2d');

            if (!canvasCtx) {
                return () => {};
            }

            analyzer.fftSize = 32768;

            const sampleWidth = context.sampleRate / analyzer.fftSize;
            const numSamplesInRange = Math.ceil(TARGET_MAX_FREQUENCY / sampleWidth);
            const samples: Array<number> = [0];

            for (let i = 1; i <= numSamplesInRange; i *= LOG_SCALING) {
                const position = Math.round(i) - 1;
                if (samples[samples.length - 1] !== position) {
                    samples.push(position);
                }
            }

            const totalNumBars = samples.length;
            const currentDataArray = new Uint8Array(numSamplesInRange);
            const barWidth = Math.floor(CANVAS_SIZE / totalNumBars) - 2;

            const draw = setInterval(() => {
                analyzer.getByteFrequencyData(currentDataArray);

                canvasCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

                let barHeight;
                let x = 0;

                for (const position of samples) {
                    barHeight = currentDataArray[position];

                    canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
                    canvasCtx.fillRect(x, CANVAS_SIZE - barHeight, barWidth, barHeight);

                    x += barWidth + 2;
                }
            }, 30);

            return () => {
                clearInterval(draw);
            };
        }

        return () => {};
    }, [webAudio, canvasRef]);

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
