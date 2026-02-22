import { useQuery } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useEffect, useState } from 'react';

const CHECK_FOR_UPDATES_INTERVAL_MS = 6 * 60 * 60 * 1000;

const utils = isElectron() ? window.api?.utils : null;

export const useCheckForUpdates = () => {
    const [enablePeriodicCheck, setEnablePeriodicCheck] = useState(false);

    // We want to skip the first check since it's already checked in the main process when the app is started
    useEffect(() => {
        const timer = setTimeout(() => setEnablePeriodicCheck(true), CHECK_FOR_UPDATES_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, []);

    const isEnabled =
        enablePeriodicCheck &&
        Boolean(isElectron() && utils?.checkForUpdates && !utils?.disableAutoUpdates?.());

    return useQuery({
        enabled: isEnabled,
        queryFn: () => utils?.checkForUpdates?.(),
        queryKey: ['app-check-for-updates'],
        refetchInterval: CHECK_FOR_UPDATES_INTERVAL_MS,
        refetchIntervalInBackground: true,
    });
};
