import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import {
    type DetectedKeys,
    getDetectedKeyId,
    type SongRef,
} from '/@/renderer/features/key-detection/detected-keys';
import { idbStateStorage } from '/@/renderer/store/utils';

interface DetectedKeyState {
    keys: DetectedKeys;
    setKey: (song: SongRef, key: string) => void;
}

/** Keys detected from the audio, kept on this device. */
export const useDetectedKeyStore = createWithEqualityFn<DetectedKeyState>()(
    persist(
        (set) => ({
            keys: {},
            setKey: (song, key) =>
                set((state) => ({ keys: { ...state.keys, [getDetectedKeyId(song)]: key } })),
        }),
        {
            name: 'store_detected_keys',
            partialize: (state) => ({ keys: state.keys }),
            storage: createJSONStorage(() => idbStateStorage),
            version: 1,
        },
    ),
);
