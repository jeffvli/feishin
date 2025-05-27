import type { SliderProps as MantineSliderProps } from '@mantine/core';

import { Slider as MantineSlider } from '@mantine/core';

import styles from './slider.module.css';

export interface SliderProps extends MantineSliderProps {}

export const Slider = ({ classNames, style, ...props }: SliderProps) => {
    return (
        <MantineSlider
            classNames={{
                bar: styles.bar,
                label: styles.label,
                thumb: styles.thumb,
                track: styles.track,
                ...classNames,
            }}
            style={{
                ...style,
            }}
            {...props}
        />
    );
};
