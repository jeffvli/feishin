import { useCallback, useEffect, useRef } from 'react';

interface UseLongPressHandlers {
    onClick: (event: React.MouseEvent) => void;
    onContextMenu: (event: React.MouseEvent) => void;
    onPointerCancel: () => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: () => void;
}

interface UseLongPressOptions {
    delay?: number;
    moveThreshold?: number;
    onClick?: () => void;
    onLongPress: () => void;
}

// Long-press via pointer events rather than the native `contextmenu` event —
// iOS Safari doesn't reliably fire `contextmenu` on a touch-and-hold over an
// arbitrary element, only Android/desktop do. `contextmenu` is still wired
// up below, just as a second, faster trigger for desktop mouse users
// (right click) rather than the sole source.
export function useLongPress({
    delay = 350,
    moveThreshold = 10,
    onClick,
    onLongPress,
}: UseLongPressOptions): UseLongPressHandlers {
    const timerRef = useRef<null | number>(null);
    const releaseTimerRef = useRef<null | number>(null);
    const firedRef = useRef(false);
    const startPosRef = useRef<null | { x: number; y: number }>(null);

    // `user-select: none` (remote-reset.css) should already stop this, but
    // some mobile browsers/WebViews run their own native long-press-to-select
    // gesture on an independent timer, not tied to CSS at all — clearing the
    // selection only at pointerdown and once our own timer fires leaves a gap
    // where the native gesture can still win (its threshold doesn't have to
    // match ours) and leave text highlighted after the sheet opens. Watching
    // `selectionchange` for the whole gesture closes that gap: any selection
    // the browser creates while a press is in flight gets wiped immediately,
    // regardless of which timer produced it.
    const handleSelectionChange = useCallback(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            selection.removeAllRanges();
        }
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const clearReleaseTimer = useCallback(() => {
        if (releaseTimerRef.current !== null) {
            window.clearTimeout(releaseTimerRef.current);
            releaseTimerRef.current = null;
        }
    }, []);

    // Stops the whole gesture: cancels any pending timer and, since there's
    // no longer a press to protect, stops watching for stray selections too.
    const clear = useCallback(() => {
        clearTimer();
        clearReleaseTimer();
        document.removeEventListener('selectionchange', handleSelectionChange);
    }, [clearTimer, clearReleaseTimer, handleSelectionChange]);

    useEffect(() => clear, [clear]);

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;

            firedRef.current = false;
            startPosRef.current = { x: event.clientX, y: event.clientY };
            clear();
            window.getSelection()?.removeAllRanges();
            document.addEventListener('selectionchange', handleSelectionChange);

            timerRef.current = window.setTimeout(() => {
                firedRef.current = true;
                // Keep watching selectionchange until the finger actually
                // lifts (onPointerUp/onPointerCancel) — the native gesture
                // that raced us here can still land a selection after our
                // timer fired but before the user releases.
                clearTimer();
                navigator.vibrate?.(10);
                onLongPress();
            }, delay);
        },
        [clear, clearTimer, delay, handleSelectionChange, onLongPress],
    );

    const onPointerMove = useCallback(
        (event: React.PointerEvent) => {
            // Once the long-press has fired, movement must not cancel the
            // gesture anymore — in particular it must not tear down the
            // selectionchange watch above, which is relied on to keep
            // clearing stray selections until the finger actually lifts.
            if (firedRef.current) return;

            const start = startPosRef.current;
            if (!start) return;

            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;

            if (Math.hypot(dx, dy) > moveThreshold) {
                clear();
            }
        },
        [clear, moveThreshold],
    );

    const onPointerUp = useCallback(() => {
        clearTimer();
        window.getSelection()?.removeAllRanges();

        // iOS Safari can finalize the native long-press-to-select selection
        // right as the finger lifts, rendering the blue handles/callout menu
        // from a `selectionchange` that only fires after this handler already
        // ran. Tearing the listener down synchronously here loses that race —
        // the longer the press was held, the more likely it is that the
        // native gesture is still committing. Give it a brief grace period
        // past release before actually stopping the watch.
        clearReleaseTimer();
        releaseTimerRef.current = window.setTimeout(() => {
            releaseTimerRef.current = null;
            window.getSelection()?.removeAllRanges();
            document.removeEventListener('selectionchange', handleSelectionChange);
        }, 300);
    }, [clearTimer, clearReleaseTimer, handleSelectionChange]);

    const onClickHandler = useCallback(
        (event: React.MouseEvent) => {
            if (firedRef.current) {
                event.preventDefault();
                event.stopPropagation();
                firedRef.current = false;
                return;
            }

            onClick?.();
        },
        [onClick],
    );

    // Right click on desktop — jumps straight to the menu instead of making
    // mouse users hold the button down for `delay`.
    const onContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            clear();
            onLongPress();
        },
        [clear, onLongPress],
    );

    return {
        onClick: onClickHandler,
        onContextMenu,
        onPointerCancel: onPointerUp,
        onPointerDown,
        onPointerMove,
        onPointerUp,
    };
}
