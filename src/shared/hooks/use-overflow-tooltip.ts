import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';

/**
 * A tooltip that appears only when the text it sits on is actually being cut off.
 *
 * Single-line labels across the app are truncated in CSS, so what a card shows is decided by
 * how wide the strip happens to be. A tooltip on everything is noise; a tooltip on nothing
 * means the cut-off half is simply unreadable. This measures at the moment of hover and shows
 * one only where there is something to reveal.
 *
 * Measured on the hover event rather than through a ref and a `ResizeObserver`, which is why
 * this exists alongside `useIsOverflow`. Item rows are rendered by the hundred in a virtualised
 * grid and three at a time per card, so an observer each is a real cost paid on every list in
 * the app for a hint almost nobody asks for. `event.currentTarget` is the element, and reading
 * `scrollWidth` once per hover costs a layout the pointer has already paid for.
 *
 * Controlled rather than left to the tooltip's own hover handling, because a tooltip disabled
 * at the moment the pointer arrives never registers that hover: it would appear on the second
 * pass over a card and not the first. The delay below is the same one the tooltip applies by
 * default, kept here so the timing does not change with who is opening it.
 */

/** Matches the `openDelay` the shared tooltip uses, so a hint appears at the usual moment. */
const OPEN_DELAY_MS = 500;

export interface OverflowTooltip {
    /** Empty until a hover finds the text truncated. */
    label: string;
    onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
    opened: boolean;
}

export function useOverflowTooltip(): OverflowTooltip {
    const [state, setState] = useState<{ label: string; opened: boolean }>({
        label: '',
        opened: false,
    });

    const timer = useRef<null | ReturnType<typeof setTimeout>>(null);

    const onMouseEnter = useCallback((event: MouseEvent<HTMLElement>) => {
        const element = event.currentTarget;

        // A rounding difference of a pixel is not a truncation, and treating it as one puts a
        // tooltip on labels that are plainly complete.
        if (element.scrollWidth - element.clientWidth < 2) {
            return;
        }

        const label = element.textContent?.trim() ?? '';

        if (!label) {
            return;
        }

        timer.current = setTimeout(() => setState({ label, opened: true }), OPEN_DELAY_MS);
    }, []);

    const onMouseLeave = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }

        setState((previous) => (previous.opened ? { label: '', opened: false } : previous));
    }, []);

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    return { label: state.label, onMouseEnter, onMouseLeave, opened: state.opened };
}
