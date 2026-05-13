import { create } from 'zustand';

interface EqualizerModalStore {
    close: () => void;
    isOpen: boolean;
    open: () => void;
}

export const useEqualizerModalStore = create<EqualizerModalStore>((set) => ({
    close: () => set({ isOpen: false }),
    isOpen: false,
    open: () => set({ isOpen: true }),
}));
