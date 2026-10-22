import { describe, expect, it } from 'vitest';

import {
    clampWindowBoundsToDisplay,
    DEFAULT_WINDOW_BOUNDS,
    resolveWindowBounds,
} from '/@/main/utils/window-bounds';

const workArea = { height: 1080, width: 1920, x: 0, y: 0 };

describe('resolveWindowBounds', () => {
    it.each([
        ['nothing saved', undefined],
        ['missing size', { x: 10, y: 10 }],
        ['non-finite size', { height: 800, width: NaN }],
        ['zero size', { height: 0, width: 800 }],
    ])('uses the default size for %s', (_, saved) => {
        expect(resolveWindowBounds(saved, workArea)).toEqual(DEFAULT_WINDOW_BOUNDS);
    });

    it('restores a saved window that fits on screen', () => {
        const saved = { height: 700, width: 1000, x: 100, y: 50 };
        expect(resolveWindowBounds(saved, workArea)).toEqual(saved);
    });

    it('shrinks a window larger than the display', () => {
        expect(resolveWindowBounds({ height: 1400, width: 2560, x: 0, y: 0 }, workArea)).toEqual({
            height: 1080,
            width: 1920,
            x: 0,
            y: 0,
        });
    });

    it('drops an off-screen position, e.g. from a disconnected monitor', () => {
        expect(
            resolveWindowBounds({ height: 700, width: 1000, x: 2500, y: 100 }, workArea),
        ).toEqual({ height: 700, width: 1000 });
        expect(resolveWindowBounds({ height: 700, width: 1000 }, workArea)).toEqual({
            height: 700,
            width: 1000,
        });
    });

    it('uses the default size when an off-screen window would fill the display', () => {
        expect(
            resolveWindowBounds({ height: 1080, width: 1920, x: -3000, y: 0 }, workArea),
        ).toEqual(DEFAULT_WINDOW_BOUNDS);
    });

    it('respects a work area that does not start at the origin', () => {
        const secondScreen = { height: 1440, width: 2560, x: 1920, y: 0 };
        expect(
            resolveWindowBounds({ height: 900, width: 1200, x: 2000, y: 100 }, secondScreen),
        ).toEqual({ height: 900, width: 1200, x: 2000, y: 100 });
        expect(
            resolveWindowBounds({ height: 900, width: 1200, x: 100, y: 100 }, secondScreen),
        ).toEqual({ height: 900, width: 1200 });
    });
});

describe('clampWindowBoundsToDisplay', () => {
    it('limits the size to the display and keeps the position', () => {
        expect(
            clampWindowBoundsToDisplay({ height: 2000, width: 0, x: 5, y: 6 }, workArea),
        ).toEqual({ height: 1080, width: 1, x: 5, y: 6 });
    });
});
