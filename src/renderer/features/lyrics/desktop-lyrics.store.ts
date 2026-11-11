import type { DesktopLyricsState } from '/@/shared/types/desktop-lyrics';

import { createWithEqualityFn } from 'zustand/traditional';

export const useDesktopLyricsState = createWithEqualityFn<DesktopLyricsState>(() => ({
    locked: false,
    open: false,
    revision: -1,
    wayland: false,
}));

export const updateDesktopLyricsState = (state: DesktopLyricsState) => {
    if (state.revision >= useDesktopLyricsState.getState().revision) {
        useDesktopLyricsState.setState(state);
    }
};
