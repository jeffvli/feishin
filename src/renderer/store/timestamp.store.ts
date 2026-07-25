import { del, get, set } from 'idb-keyval';
import { useEffect, useState } from 'react';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

const PLAYER_TIMESTAMP_POLL_INTERVAL_MS = 500;

interface TimestampState {
    setTimestamp: (timestamp: number) => void;
    timestamp: number;
}

const timestampStorage = {
    getItem: async (name: string) => {
        const value = await get(name);
        if (value === undefined) {
            return null;
        }
        return { state: { timestamp: value }, version: 1 } as const;
    },
    removeItem: async (name: string) => {
        await del(name);
    },
    setItem: async (name: string, value: { state: { timestamp: number }; version?: number }) => {
        await set(name, value.state.timestamp);
    },
};

export const useTimestampStoreBase = createWithEqualityFn<TimestampState>()(
    persist(
        subscribeWithSelector((set) => ({
            setTimestamp: (timestamp: number) => {
                set({ timestamp });
            },
            timestamp: 0,
        })),
        {
            name: 'player-timestamp',
            storage: timestampStorage,
            version: 1,
        },
    ),
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
    const [timestamp, setLocalTimestamp] = useState(
        () => useTimestampStoreBase.getState().timestamp,
    );

    useEffect(() => {
        const syncTimestamp = () => {
            const nextTimestamp = useTimestampStoreBase.getState().timestamp;
            setLocalTimestamp((prevTimestamp) =>
                prevTimestamp !== nextTimestamp ? nextTimestamp : prevTimestamp,
            );
        };

        syncTimestamp();
        const interval = setInterval(syncTimestamp, PLAYER_TIMESTAMP_POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    return timestamp;
};

export const setTimestamp = (timestamp: number) => {
    useTimestampStoreBase.getState().setTimestamp(timestamp);
};
