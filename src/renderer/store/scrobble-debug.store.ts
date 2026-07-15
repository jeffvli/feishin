import { useEffect, useState } from 'react';
import { createWithEqualityFn } from 'zustand/traditional';

import { PlayerStatus } from '/@/shared/types/types';

const SCROBBLE_DEBUG_POLL_INTERVAL_MS = 1000;

export type ScrobbleDebugSnapshot = {
    eligibilityMet: boolean;
    lastListenSampleTimeSec: null | number;
    listenedMs: number;
    playerStatus: PlayerStatus;
    positionSec: number;
    songId?: string;
    songName?: string;
    submitted: boolean;
    targetDurationSec: number;
    targetPercentage: number;
    trackDurationMs: number;
};

const initialSnapshot: ScrobbleDebugSnapshot = {
    eligibilityMet: false,
    lastListenSampleTimeSec: null,
    listenedMs: 0,
    playerStatus: PlayerStatus.PAUSED,
    positionSec: 0,
    songId: undefined,
    songName: undefined,
    submitted: false,
    targetDurationSec: 240,
    targetPercentage: 75,
    trackDurationMs: 0,
};

type ScrobbleDebugStore = {
    snapshot: ScrobbleDebugSnapshot;
};

export const useScrobbleDebugStore = createWithEqualityFn<ScrobbleDebugStore>()(() => ({
    snapshot: initialSnapshot,
}));

export const useScrobbleDebugSnapshot = () => {
    const [snapshot, setLocalSnapshot] = useState(() => useScrobbleDebugStore.getState().snapshot);

    useEffect(() => {
        const syncSnapshot = () => {
            const nextSnapshot = useScrobbleDebugStore.getState().snapshot;
            setLocalSnapshot((prevSnapshot) =>
                prevSnapshot !== nextSnapshot ? nextSnapshot : prevSnapshot,
            );
        };

        syncSnapshot();
        const interval = setInterval(syncSnapshot, SCROBBLE_DEBUG_POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    return snapshot;
};

export const publishScrobbleDebug = (partial: Partial<ScrobbleDebugSnapshot>) => {
    useScrobbleDebugStore.setState((state) => ({
        snapshot: { ...state.snapshot, ...partial },
    }));
};
