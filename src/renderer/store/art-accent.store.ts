import { create } from 'zustand';

import { AccentCandidate } from '/@/shared/themes/pick-accent-color';

interface ArtAccentActions {
    clearCandidates: () => void;
    setCandidates: (imageKey: string, candidates: AccentCandidate[]) => void;
}

interface ArtAccentState {
    // Sampled colors from the current cover, kept here rather than in settings
    // so nothing ephemeral ends up persisted or pushed to the remote.
    candidates: AccentCandidate[] | null;
    imageKey: null | string;
}

export const useArtAccentStore = create<ArtAccentActions & ArtAccentState>()((set) => ({
    candidates: null,
    clearCandidates: () => set({ candidates: null, imageKey: null }),
    imageKey: null,
    setCandidates: (imageKey, candidates) => set({ candidates, imageKey }),
}));

export const useArtAccentCandidates = () => useArtAccentStore((state) => state.candidates);
