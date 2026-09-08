import { SliderProps } from '@mantine/core';
import { CSSProperties, ReactNode, useState } from 'react';

import styles from './wrapped-slider.module.css';

import { Slider } from '/@/shared/components/slider/slider';
import { Text } from '/@/shared/components/text/text';

const PlayerbarSlider = ({
    thumbSize = '1.3rem',
    ...props
}: SliderProps & { thumbSize?: string }) => {
    return (
        <Slider
            classNames={{
                bar: styles.bar,
                label: styles['slider-label'],
                root: styles.root,
                thumb: styles.thumb,
                track: styles.track,
            }}
            style={{ '--thumb-size': thumbSize } as CSSProperties}
            {...props}
            onClick={(e) => {
                e?.stopPropagation();
            }}
        />
    );
};

export interface WrappedProps extends Omit<SliderProps, 'onChangeEnd'> {
    leftLabel?: ReactNode;
    onChangeEnd: (value: number) => void;
    rightLabel?: ReactNode;
    thumbSize?: string;
    trackSize?: number;
    value: number;
}

export const WrappedSlider = ({
    leftLabel,
    rightLabel,
    thumbSize,
    trackSize = 6,
    value,
    ...props
}: WrappedProps) => {
    const [isSeeking, setIsSeeking] = useState(false);
    const [seek, setSeek] = useState(0);

    return (
        <div className={styles.container}>
            {leftLabel && (
                <Text className={styles['label-left']} isNoSelect size="sm">
                    {leftLabel}
                </Text>
            )}
            <PlayerbarSlider
                {...props}
                min={0}
                onChange={(e) => {
                    setIsSeeking(true);
                    setSeek(e);
                }}
                onChangeEnd={(e) => {
                    props.onChangeEnd(e);
                    setIsSeeking(false);
                }}
                size={trackSize}
                thumbSize={thumbSize}
                value={!isSeeking ? (value ?? 0) : seek}
                w="100%"
            />
            {rightLabel && (
                <Text className={styles['label-right']} isNoSelect size="sm">
                    {rightLabel}
                </Text>
            )}
        </div>
    );
};
