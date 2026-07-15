const MIN_SCROLL_DURATION_MS = 350;
const MAX_SCROLL_DURATION_MS = 850;
const SCROLL_DURATION_PER_PX_MS = 0.55;
const INSTANT_SCROLL_THRESHOLD_PX = 2;

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

export const computeScrollDurationMs = (deltaPx: number): number =>
    Math.min(
        Math.max(Math.abs(deltaPx) * SCROLL_DURATION_PER_PX_MS, MIN_SCROLL_DURATION_MS),
        MAX_SCROLL_DURATION_MS,
    );

const activeAnimations = new WeakMap<HTMLElement, number>();

export const cancelScrollAnimation = (element: HTMLElement): void => {
    const frameId = activeAnimations.get(element);
    if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
        activeAnimations.delete(element);
    }
};

export interface AnimateScrollTopOptions {
    onComplete?: () => void;
    smooth?: boolean;
}

export const animateScrollTop = (
    element: HTMLElement,
    targetTop: number,
    options: AnimateScrollTopOptions = {},
): (() => void) => {
    const { onComplete, smooth = true } = options;
    const startTop = element.scrollTop;
    const delta = targetTop - startTop;

    cancelScrollAnimation(element);

    if (!smooth || Math.abs(delta) <= INSTANT_SCROLL_THRESHOLD_PX) {
        element.scrollTop = targetTop;
        onComplete?.();
        return () => {};
    }

    const durationMs = computeScrollDurationMs(delta);
    const startTime = performance.now();
    let frameId: null | number = null;
    let cancelled = false;

    const cancel = (): void => {
        if (cancelled) {
            return;
        }

        cancelled = true;
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            activeAnimations.delete(element);
            frameId = null;
        }
    };

    const step = (now: number): void => {
        if (cancelled) {
            return;
        }

        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = easeOutCubic(progress);
        element.scrollTop = startTop + delta * eased;

        if (progress < 1) {
            frameId = requestAnimationFrame(step);
            activeAnimations.set(element, frameId);
        } else {
            activeAnimations.delete(element);
            frameId = null;
            onComplete?.();
        }
    };

    frameId = requestAnimationFrame(step);
    activeAnimations.set(element, frameId);

    return cancel;
};
