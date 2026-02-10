import { create } from 'zustand';

type ScrollState = {
    getOffset: (key: string) => number | undefined;
    offsets: Record<string, number>;
    setOffset: (key: string, offset: number) => void;
};

export const useScrollStore = create<ScrollState>((set, get) => ({
    getOffset: (key) => get().offsets[key],
    offsets: {},
    setOffset: (key, offset) =>
        set((s) => ({
            offsets: { ...s.offsets, [key]: offset },
        })),
}));
