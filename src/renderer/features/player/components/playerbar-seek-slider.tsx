import formatDuration from 'format-duration';
import { useEffect, useRef, useState } from 'react';

import styles from './playerbar-slider.module.css';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerTimestamp } from '/@/renderer/store';
import { CustomPlayerbarSlider } from './playerbar-slider';

interface PlayerbarSeekSliderProps {
    max: number;
    min: number;
}

export const PlayerbarSeekSlider = ({ max, min }: PlayerbarSeekSliderProps) => {
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const currentTime = usePlayerTimestamp();
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSeekValueRef = useRef<null | number>(null);

    const { mediaSeekToTimestamp } = usePlayer();

    const handleSeekToTimestamp = (timestamp: number) => {
        mediaSeekToTimestamp(timestamp);
    };

    // Sync isSeeking state when currentTime catches up to seek value
    useEffect(() => {
        if (isSeeking && lastSeekValueRef.current !== null) {
            const timeDiff = Math.abs(currentTime - lastSeekValueRef.current);
            if (timeDiff < 0.5) {
                setIsSeeking(false);
                lastSeekValueRef.current = null;
                if (seekTimeoutRef.current) {
                    clearTimeout(seekTimeoutRef.current);
                    seekTimeoutRef.current = null;
                }
            }
        }
    }, [currentTime, isSeeking]);

    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

    return (
        <CustomPlayerbarSlider
            label={(value) => formatDuration(value * 1000)}
            max={max}
            min={min}
            onChange={(e) => {
                // Cancel any pending timeout if user starts seeking again
                if (seekTimeoutRef.current) {
                    clearTimeout(seekTimeoutRef.current);
                    seekTimeoutRef.current = null;
                }
                setIsSeeking(true);
                setSeekValue(e);
            }}
            onChangeEnd={(e) => {
                setSeekValue(e);
                lastSeekValueRef.current = e;
                handleSeekToTimestamp(e);

                if (seekTimeoutRef.current) {
                    clearTimeout(seekTimeoutRef.current);
                }

                // Keep isSeeking true to prevent slider from snapping back.
                // The useEffect will detect when currentTime catches up and clear isSeeking.
                // Also set a fallback timeout to clear isSeeking after a max delay
                // in case the seek doesn't complete (e.g., network issues).
                seekTimeoutRef.current = setTimeout(() => {
                    setIsSeeking(false);
                    lastSeekValueRef.current = null;
                    seekTimeoutRef.current = null;
                }, 1000);
            }}
            onClick={(e) => {
                e?.stopPropagation();
            }}
            size={6}
            value={
                isSeeking
                    ? seekValue
                    : lastSeekValueRef.current !== null &&
                        Math.abs(currentTime - lastSeekValueRef.current) > 0.5
                      ? lastSeekValueRef.current
                      : currentTime
            }
            w="100%"
        />
    );
};
