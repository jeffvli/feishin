import styles from './playerbar-slider.module.css';

import { Slider, SliderProps } from '/@/shared/components/slider/slider';

export const PlayerbarSlider = ({ ...props }: SliderProps) => {
    return (
        <Slider
            classNames={{
                bar: styles.bar,
                label: styles.label,
                root: styles.root,
                thumb: styles.thumb,
                track: styles.track,
            }}
            {...props}
            onClick={(e) => {
                e?.stopPropagation();
            }}
        />
    );
};
