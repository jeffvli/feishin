import { useCallback, useEffect, useRef } from 'react';

export const useDoubleClick = ({
    latency = 160,
    onDoubleClick = () => null,
    onSingleClick = () => null,
}: {
    latency?: number;
    onDoubleClick?: (e: any) => void;
    onSingleClick?: (e: any) => void;
}) => {
    const clickCountRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleClick = useCallback(
        (e: any) => {
            clickCountRef.current += 1;

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout to determine if it's a single or double click
            timeoutRef.current = setTimeout(() => {
                if (clickCountRef.current === 1) {
                    onSingleClick(e);
                } else if (clickCountRef.current === 2) {
                    onDoubleClick(e);
                }

                clickCountRef.current = 0;
            }, latency);
        },
        [latency, onDoubleClick, onSingleClick],
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return handleClick;
};
