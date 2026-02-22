import { subscribeWithSelector } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { DlnaDevice } from '/@/shared/types/dlna';

interface DlnaState {
    dlnaDevice: DlnaDevice | null;
    setDlnaDevice: (dlna: DlnaDevice | null) => void;
}

export const useDlnaStore = createWithEqualityFn<DlnaState>()(
    subscribeWithSelector((set) => ({
        dlnaDevice: null,
        setDlnaDevice: (dlna: DlnaDevice | null) => {
            set({ dlnaDevice: dlna });
        },
    })),
);
