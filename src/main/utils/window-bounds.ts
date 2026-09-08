export type WindowRect = {
    height: number;
    width: number;
    x: number;
    y: number;
};

export const DEFAULT_WINDOW_BOUNDS = { height: 900, width: 1440 };

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
