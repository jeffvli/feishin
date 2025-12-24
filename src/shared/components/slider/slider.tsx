import type { SliderProps as MantineSliderProps } from '@mantine/core';

import { Slider as MantineSlider } from '@mantine/core';
import { forwardRef } from 'react';

import styles from './slider.module.css';

export interface SliderProps extends MantineSliderProps {}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
    ({ classNames, style, ...props }, ref) => {
        return (
            <MantineSlider
                classNames={{
                    bar: styles.bar,
                    label: styles.label,
                    thumb: styles.thumb,
                    track: styles.track,
                    ...classNames,
                }}
                ref={ref}
                style={{
                    ...style,
                }}
                {...props}
            />
        );
    },
);
