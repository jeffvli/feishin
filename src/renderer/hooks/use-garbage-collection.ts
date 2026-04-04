import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const GARBAGE_COLLECTION_INTERVAL = 1000 * 60 * 5;

export const useGarbageCollection = () => {
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const startInterval = () => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }

        intervalIdRef.current = setInterval(() => {
            window.api?.utils?.forceGarbageCollection?.();
        }, GARBAGE_COLLECTION_INTERVAL);
    };

    // Clear the cache on an interval
    useEffect(() => {
        if (!isElectron()) {
            return;
        }

        startInterval();

        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, []);

    const location = useLocation();

    // Clear the cache when the location changes
    useEffect(() => {
        if (!isElectron()) {
            return;
        }

        // Clear the interval when the location changes
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }

        window.api?.utils?.forceGarbageCollection?.();
        startInterval();
    }, [location]);
};
