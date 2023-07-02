import type { SliderProps as MantineSliderProps } from '@mantine/core';
import { Slider as MantineSlider } from '@mantine/core';
import styled from 'styled-components';

type SliderProps = MantineSliderProps;

const StyledSlider = styled(MantineSlider)`
    & .mantine-Slider-track {
        height: 0.5rem;
        background-color: var(--slider-track-bg);
    }

    & .mantine-Slider-bar {
        background-color: var(--primary-color);
    }

    & .mantine-Slider-thumb {
        width: 1rem;
        height: 1rem;
        background: var(--slider-thumb-bg);
        border: none;
    }

    & .mantine-Slider-label {
        padding: 0 1rem;
        color: var(--tooltip-fg);
        font-size: 1em;
        background: var(--tooltip-bg);
    }
`;

export const Slider = ({ ...props }: SliderProps) => {
    return <StyledSlider {...props} />;
};
