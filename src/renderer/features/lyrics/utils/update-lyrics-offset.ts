import type { LyricsQueryResult } from '/@/renderer/features/lyrics/api/lyrics-api';

// Shared by the original lyrics controls and requests from the desktop window.
export const updateLyricsOffset = (
    previous: LyricsQueryResult | undefined,
    index: number,
    offsetMs: number,
): LyricsQueryResult | undefined => {
    if (!previous) return previous;
    const updated = { ...previous, selectedOffsetMs: offsetMs };
    if (Array.isArray(previous.local) && previous.local.length > 0) {
        const selectedIndex = Math.max(0, Math.min(index, previous.local.length - 1));
        updated.local = [...previous.local];
        updated.local[selectedIndex] = { ...updated.local[selectedIndex], offsetMs };
    }
    return updated;
};
