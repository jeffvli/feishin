import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

type AppUpdateState = Awaited<ReturnType<Window['api']['utils']['getUpdateState']>>;

const initialUpdateState: AppUpdateState = { status: 'idle' };

export const useAppUpdateState = () => {
    const [updateState, setUpdateState] = useState<AppUpdateState>(initialUpdateState);

    useEffect(() => {
        if (!isElectron()) return;

        let active = true;
        let receivedLiveUpdate = false;

        const handleUpdateAvailable = (version: string) => {
            receivedLiveUpdate = true;
            setUpdateState({ status: 'available', version });
        };

        const handleUpdateDownloaded = (version: string) => {
            receivedLiveUpdate = true;
            setUpdateState({ status: 'downloaded', version });
        };

        const removeAvailableListener =
            window.api.utils.rendererUpdateAvailable(handleUpdateAvailable);
        const removeDownloadedListener =
            window.api.utils.rendererUpdateDownloaded(handleUpdateDownloaded);

        void window.api.utils
            .getUpdateState()
            .then((state) => {
                if (active && !receivedLiveUpdate) {
                    setUpdateState(state);
                }
            })
            .catch(() => undefined);

        return () => {
            active = false;
            removeAvailableListener();
            removeDownloadedListener();
        };
    }, []);

    return updateState;
};
