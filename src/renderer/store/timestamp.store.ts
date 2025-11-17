import { subscribeWithSelector } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

interface TimestampState {
    setTimestamp: (timestamp: number) => void;
    timestamp: number;
}

export const useTimestampStoreBase = createWithEqualityFn<TimestampState>()(
    subscribeWithSelector((set) => ({
        setTimestamp: (timestamp: number) => {
            set({ timestamp });
        },
        timestamp: 0,
    })),
);

export const subscribePlayerProgress = (
    onChange: (properties: { timestamp: number }, prev: { timestamp: number }) => void,
) => {
    return useTimestampStoreBase.subscribe(
        (state) => state.timestamp,
        (timestamp, prevTimestamp) => {
            onChange({ timestamp }, { timestamp: prevTimestamp });
        },
        {
            equalityFn: (a, b) => {
                return a === b;
            },
        },
    );
};

export const usePlayerProgress = () => {
    return useTimestampStoreBase((state) => state.timestamp);
};

export const usePlayerTimestamp = () => {
    return useTimestampStoreBase((state) => state.timestamp);
};

export const setTimestamp = (timestamp: number) => {
    useTimestampStoreBase.getState().setTimestamp(timestamp);
};
