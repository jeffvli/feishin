import { MouseEvent } from 'react';

interface DoubleClickHandlerOptions<T extends HTMLElement = HTMLElement> {
    delay?: number;
    onDoubleClick?: (event: MouseEvent<T>) => void;
    onSingleClick?: (event: MouseEvent<T>) => void;
}

/**
 * Creates a handler that manages single and double-click events,
 * ensuring double-click doesn't trigger single-click
 */
export const createDoubleClickHandler = <T extends HTMLElement = HTMLElement>(
    options: DoubleClickHandlerOptions<T>,
) => {
    const { delay = 200, onDoubleClick, onSingleClick } = options;

    let clickTimeout: NodeJS.Timeout | null = null;
    let clickCount = 0;

    const handleClick = (event: MouseEvent<T>) => {
        clickCount++;

        if (clickCount === 1) {
            // First click - set a timeout to handle single click
            clickTimeout = setTimeout(() => {
                if (clickCount === 1) {
                    // Only single click occurred
                    onSingleClick?.(event);
                }
                clickCount = 0;
                clickTimeout = null;
            }, delay);
        } else if (clickCount === 2) {
            // Double click detected
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }

            onDoubleClick?.(event);
            clickCount = 0;
        }
    };

    return handleClick;
};
