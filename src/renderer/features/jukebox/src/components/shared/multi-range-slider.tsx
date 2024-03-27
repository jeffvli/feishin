import styles from './multi-range-slider.module.scss';
import type { ChangeEvent } from 'react';
import React, { useEffect, useState, useCallback, useRef } from 'react';

// Adapted from: https://dev.to/sandra_lewis/building-a-multi-range-slider-in-react-from-scratch-4dl1

type Props = {
    min: number;
    max: number;
    minDefaultValue: number;
    maxDefaultValue: number;
    onChange: (value: { min: number; max: number }) => void;
};

export function MultiRangeSlider(props: Readonly<Props>): JSX.Element {
    const [minVal, setMinVal] = useState(props.minDefaultValue);
    const [maxVal, setMaxVal] = useState(props.maxDefaultValue);

    const minValRef = useRef<HTMLInputElement>(null);
    const maxValRef = useRef<HTMLInputElement>(null);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = useCallback(
        (value: number) =>
            Math.round(((value - props.min) / (props.max - props.min)) * 100),
        [props.min, props.max],
    );

    // Set width of the range to decrease from the left side
    useEffect(() => {
        if (maxValRef.current) {
            const minPercent = getPercent(minVal);
            const maxPercent = getPercent(maxValRef.current.valueAsNumber);

            if (range.current) {
                range.current.style.left = `${minPercent}%`;
                range.current.style.width = `${maxPercent - minPercent}%`;
            }
        }
    }, [minVal, getPercent]);

    // Set width of the range to decrease from the right side
    useEffect(() => {
        if (minValRef.current) {
            const minPercent = getPercent(minValRef.current.valueAsNumber);
            const maxPercent = getPercent(maxVal);

            if (range.current) {
                range.current.style.width = `${maxPercent - minPercent}%`;
            }
        }
    }, [maxVal, getPercent]);

    // Get min and max values when their state changes
    useEffect(() => {
        props.onChange({ min: minVal, max: maxVal });
    }, [minVal, maxVal, props.onChange]);

    return (
        <div className={styles['container']}>
            <input
                type="range"
                min={props.min}
                max={props.max}
                value={minVal}
                ref={minValRef}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const value = Math.min(
                        event.target.valueAsNumber,
                        maxVal - 1,
                    );
                    setMinVal(value);
                    event.target.value = value.toString();
                }}
                className={
                    styles['thumb'] +
                    ' ' +
                    styles['thumb--zindex-3'] +
                    (minVal > props.max - (10 * props.max) / 100
                        ? ' ' + styles['thumb--zindex-5']
                        : '')
                }
            />
            <input
                type="range"
                min={props.min}
                max={props.max}
                value={maxVal}
                ref={maxValRef}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const value = Math.max(
                        event.target.valueAsNumber,
                        minVal + 1,
                    );
                    setMaxVal(value);
                    event.target.value = value.toString();
                }}
                className={styles['thumb'] + ' ' + styles['thumb--zindex-4']}
            />

            <div className={styles['slider']}>
                <div className={styles['slider__track']}></div>
                <div ref={range} className={styles['slider__range']}></div>
            </div>
        </div>
    );
}
