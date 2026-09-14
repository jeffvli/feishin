import formatDuration from 'format-duration';
import { useEffect, useRef, useState } from 'react';

import { CustomPlayerbarSlider } from './playerbar-slider';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerTimestamp } from '/@/renderer/store';

interface PlayerbarSeekSliderProps {
    max: number;
    min: number;
}

const SEEK_RESOLVE_MS = 1000;

export const PlayerbarSeekSlider = ({ max, min }: PlayerbarSeekSliderProps) => {
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const currentTime = usePlayerTimestamp();
    const { mediaSeekToTimestamp } = usePlayer();
    const releasedAtRef = useRef<null | number>(null);

    // Resolve isSeeking once currentTime catches up to the seek target, or after
    // a timeout - but only once the slider has actually been released
    // (onChangeEnd), so holding it still mid-drag (without releasing) never gets
    // interrupted/snapped back to the live position. Both checks ride on the
    // currentTime poll itself (which fires every ~500ms) rather than a
    // separately armed setTimeout, so the resolve can't be silently cancelled
    // and left stuck once it is eligible to run.
    useEffect(() => {
        if (!isSeeking || releasedAtRef.current === null) {
            return;
        }

        const closeEnough = Math.abs(currentTime - seekValue) < 0.5;
        const timedOut = Date.now() - releasedAtRef.current > SEEK_RESOLVE_MS;

        if (closeEnough || timedOut) {
            setIsSeeking(false);
            releasedAtRef.current = null;
        }
    }, [currentTime, isSeeking, seekValue]);

    return (
        <CustomPlayerbarSlider
            label={(value) => formatDuration(value * 1000)}
            max={max}
            min={min}
            onChange={(e) => {
                releasedAtRef.current = null;
                setIsSeeking(true);
                setSeekValue(e);
            }}
            onChangeEnd={(e) => {
                setSeekValue(e);
                mediaSeekToTimestamp(e);

                if (Math.abs(currentTime - e) < 0.5) {
                    setIsSeeking(false);
                    releasedAtRef.current = null;
                } else {
                    releasedAtRef.current = Date.now();
                }
            }}
            onClick={(e) => {
                e?.stopPropagation();
            }}
            size={6}
            value={isSeeking ? seekValue : currentTime}
            w="100%"
        />
    );
};
