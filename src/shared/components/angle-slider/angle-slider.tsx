import {
    AngleSlider as MantineAngleSlider,
    AngleSliderProps as MantineAngleSliderProps,
} from '@mantine/core';
import { forwardRef } from 'react';

export interface AngleSliderProps extends MantineAngleSliderProps {}

export const AngleSlider = forwardRef<HTMLDivElement, AngleSliderProps>((props, ref) => {
    return <MantineAngleSlider {...props} ref={ref} />;
});

AngleSlider.displayName = 'AngleSlider';
