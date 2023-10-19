import { createRef, useCallback, useEffect, useState } from 'react';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { Wave } from '@foobar404/wave';
import styled from 'styled-components';

const StyledContainer = styled.div`
    max-width: 100%;

    canvas {
        margin: auto;
        width: 100%;
    }
`;

export const Visualizer = () => {
    const { webAudio } = useWebAudio();
    const canvasRef = createRef<HTMLCanvasElement>();

    const [wave, setWave] = useState<Wave>();
    const [length, setLength] = useState(500);

    useEffect(() => {
        if (webAudio?.analyzer && !wave) {
            const wv = new Wave(webAudio.analyzer, canvasRef.current!);

            const style = getComputedStyle(document.body);
            const primary = style.getPropertyValue('--primary-color');
            const fg = style.getPropertyValue('--main-fg');

            wv.addAnimation(
                new wv.animations.Turntable({
                    count: 12,
                    diameter: 200,
                    fillColor: fg,
                    frequencyBand: 'base',
                    gap: 10,
                    lineColor: primary,
                    lineWidth: 2,
                    rotate: -106,
                    rounded: true,
                }),
            );

            wv.addAnimation(
                new wv.animations.Shine({
                    count: 50,
                    diameter: 700,
                    frequencyBand: 'mids',
                    glow: {
                        color: fg,
                        strength: 5,
                    },
                    lineColor: primary,
                    lineWidth: 5,
                    rotate: 150,
                }),
            );

            setWave(wv);
        }
    }, [webAudio?.analyzer, wave, canvasRef]);

    const resize = useCallback(() => {
        const body = document.querySelector('.full-screen-player-queue-container');
        const header = document.querySelector('.full-screen-player-queue-header');

        if (body && header) {
            const width = body.clientWidth - 30;
            const height = body.clientHeight - header.clientHeight;

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
                height={1000}
                width={1000}
            />
        </StyledContainer>
    );
};
