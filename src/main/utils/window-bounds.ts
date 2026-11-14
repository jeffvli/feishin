export type WindowRect = {
    height: number;
    width: number;
    x: number;
    y: number;
};

export const DEFAULT_WINDOW_BOUNDS = { height: 900, width: 1440 };
export const WINDOW_MIN_SIZE = { height: 120, width: 480 };

const isFiniteNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value);
};

const isOffScreen = (bounds: Pick<WindowRect, 'x' | 'y'>, workArea: WindowRect): boolean => {
    return (
        bounds.x > workArea.x + workArea.width ||
        bounds.x < workArea.x ||
        bounds.y < workArea.y ||
        bounds.y > workArea.y + workArea.height
    );
};

export const clampWindowBoundsToDisplay = (
    bounds: WindowRect,
    workArea: WindowRect,
): WindowRect => {
    return {
        height: Math.min(Math.max(bounds.height, 1), workArea.height),
        width: Math.min(Math.max(bounds.width, 1), workArea.width),
        x: bounds.x,
        y: bounds.y,
    };
};

export const resolveWindowBounds = (
    saved: Partial<WindowRect> | undefined,
    workArea: WindowRect,
): Partial<WindowRect> => {
    if (!saved || !isFiniteNumber(saved.width) || !isFiniteNumber(saved.height)) {
        return { ...DEFAULT_WINDOW_BOUNDS };
    }

    if (saved.width < 1 || saved.height < 1) {
        return { ...DEFAULT_WINDOW_BOUNDS };
    }

    const width = Math.min(saved.width, workArea.width);
    const height = Math.min(saved.height, workArea.height);

    if (
        !isFiniteNumber(saved.x) ||
        !isFiniteNumber(saved.y) ||
        isOffScreen({ x: saved.x, y: saved.y }, workArea)
    ) {
        if (saved.width >= workArea.width || saved.height >= workArea.height) {
            return { ...DEFAULT_WINDOW_BOUNDS };
        }

        return { height, width };
    }

    return { height, width, x: saved.x, y: saved.y };
};

export const MINI_PLAYER_DEFAULT_BOUNDS = { height: 140, width: 400 };
export const MINI_PLAYER_MIN_SIZE = { height: 100, width: 280 };

const MINI_PLAYER_SCREEN_MARGIN = 16;

// Mini player bounds are kept separate from the full window bounds. Use the saved
// ones when they still fit on screen, otherwise dock to the bottom-right corner.
export const resolveMiniPlayerBounds = (
    saved: Partial<WindowRect> | undefined,
    workArea: WindowRect,
): WindowRect => {
    const size =
        saved &&
        isFiniteNumber(saved.width) &&
        isFiniteNumber(saved.height) &&
        saved.width >= 1 &&
        saved.height >= 1
            ? { height: saved.height, width: saved.width }
            : MINI_PLAYER_DEFAULT_BOUNDS;
    const width = Math.min(size.width, workArea.width);
    const height = Math.min(size.height, workArea.height);

    if (
        saved &&
        isFiniteNumber(saved.x) &&
        isFiniteNumber(saved.y) &&
        !isOffScreen({ x: saved.x, y: saved.y }, workArea)
    ) {
        return { height, width, x: saved.x, y: saved.y };
    }

    return {
        height,
        width,
        x: workArea.x + Math.max(workArea.width - width - MINI_PLAYER_SCREEN_MARGIN, 0),
        y: workArea.y + Math.max(workArea.height - height - MINI_PLAYER_SCREEN_MARGIN, 0),
    };
};
