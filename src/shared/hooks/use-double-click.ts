import { useCallback, useEffect, useRef } from 'react';

export const useDoubleClick = ({
    doubleClickLatency = 300,
    onDoubleClick = () => null,
    onSingleClick = () => null,
    singleClickLatency = 20,
}: {
    doubleClickLatency?: number;
    onDoubleClick?: (e: any) => void;
    onSingleClick?: (e: any) => void;
    singleClickLatency?: number;
}) => {
    const clickCountRef = useRef(0);
    const singleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const singleClickFiredRef = useRef(false);
    const lastClickEventRef = useRef<any>(null);

    // Use latency for backward compatibility, but prefer doubleClickLatency
    const effectiveDoubleClickLatency = doubleClickLatency;
    const effectiveSingleClickLatency = singleClickLatency ?? 50;

    const clearSingleClick = useCallback(() => {
        if (singleClickTimeoutRef.current) {
            clearTimeout(singleClickTimeoutRef.current);
            singleClickTimeoutRef.current = null;
        }
    }, []);

    const handleClick = useCallback(
        (e: any) => {
            clickCountRef.current += 1;
            lastClickEventRef.current = e;

            if (clickCountRef.current === 1) {
                // First click: fire single click optimistically after short delay
                singleClickFiredRef.current = false;

                // Set double-click detection window first
                doubleClickTimeoutRef.current = setTimeout(() => {
                    clickCountRef.current = 0;
                    singleClickFiredRef.current = false;
                }, effectiveDoubleClickLatency);

                // Fire single click after delay (defaults to 0 for immediate response)
                if (effectiveSingleClickLatency > 0) {
                    singleClickTimeoutRef.current = setTimeout(() => {
                        // Only fire if still a single click and double click hasn't been detected
                        if (clickCountRef.current === 1 && !singleClickFiredRef.current) {
                            singleClickFiredRef.current = true;
                            onSingleClick(lastClickEventRef.current);
                        }
                    }, effectiveSingleClickLatency);
                } else {
                    // Fire immediately if latency is 0
                    // Note: If double click comes immediately after, both may fire
                    // For best UX, use a small delay (e.g., 50ms) instead of 0
                    singleClickFiredRef.current = true;
                    onSingleClick(lastClickEventRef.current);
                }
            } else if (clickCountRef.current === 2) {
                // Second click detected within double-click latency
                // Cancel single click if it hasn't fired yet
                if (!singleClickFiredRef.current) {
                    clearSingleClick();
                }

                // Fire double click
                onDoubleClick(e);

                // Reset state
                clickCountRef.current = 0;
                singleClickFiredRef.current = false;

                // Clear double-click timeout
                if (doubleClickTimeoutRef.current) {
                    clearTimeout(doubleClickTimeoutRef.current);
                    doubleClickTimeoutRef.current = null;
                }
            }
        },
        [
            effectiveDoubleClickLatency,
            effectiveSingleClickLatency,
            onDoubleClick,
            onSingleClick,
            clearSingleClick,
        ],
    );

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (singleClickTimeoutRef.current) {
                clearTimeout(singleClickTimeoutRef.current);
            }
            if (doubleClickTimeoutRef.current) {
                clearTimeout(doubleClickTimeoutRef.current);
            }
        };
    }, []);

    return handleClick;
};
