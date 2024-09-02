import { useState, ReactNode } from 'react';
import { SliderProps } from '@mantine/core';
import styled from 'styled-components';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';

const SliderContainer = styled.div`
    display: flex;
    width: 95%;
    height: 20px;
    margin: 10px 0;
`;

const SliderValueWrapper = styled.div<{ $position: 'left' | 'right' }>`
    display: flex;
    flex: 1;
    align-self: flex-end;
    justify-content: center;
    max-width: 50px;
`;

const SliderWrapper = styled.div`
    display: flex;
    flex: 6;
    align-items: center;
    height: 100%;
`;

export interface WrappedProps extends Omit<SliderProps, 'onChangeEnd'> {
    leftLabel?: ReactNode;
    onChangeEnd: (value: number) => void;
    rightLabel?: ReactNode;
    value: number;
}

export const WrapperSlider = ({ leftLabel, rightLabel, value, ...props }: WrappedProps) => {
    const [isSeeking, setIsSeeking] = useState(false);
    const [seek, setSeek] = useState(0);

    return (
        <SliderContainer>
            {leftLabel && <SliderValueWrapper $position="left">{leftLabel}</SliderValueWrapper>}
            <SliderWrapper>
                <PlayerbarSlider
                    {...props}
                    min={0}
                    size={6}
                    value={!isSeeking ? (value ?? 0) : seek}
                    w="100%"
                    onChange={(e) => {
                        setIsSeeking(true);
                        setSeek(e);
                    }}
                    onChangeEnd={(e) => {
                        props.onChangeEnd(e);
                        setIsSeeking(false);
                    }}
                />
            </SliderWrapper>
            {rightLabel && <SliderValueWrapper $position="right">{rightLabel}</SliderValueWrapper>}
        </SliderContainer>
    );
};
