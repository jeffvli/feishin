import { useMemo } from 'react';
import isElectron from 'is-electron';
import { Navigate, Outlet } from 'react-router-dom';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { getIsCredentialRequired } from '/@/renderer/features/action-required/routes/action-required-route';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const AppOutlet = () => {
    const currentServer = useCurrentServer();

    const isActionsRequired = useMemo(() => {
        const isMpvRequired = () => {
            if (!localSettings) return false;
            const mpvPath = localSettings.get('mpv_path');
            if (mpvPath) return false;
            return true;
        };

        const isCredentialRequired = getIsCredentialRequired(currentServer);

        const isServerRequired = !currentServer;

        const actions = [isServerRequired, isCredentialRequired, isMpvRequired()];
        const isActionRequired = actions.some((c) => c);

        return isActionRequired;
    }, [currentServer]);

    if (isActionsRequired) {
        return (
            <Navigate
                replace
                to={AppRoute.ACTION_REQUIRED}
            />
        );
    }

    return <Outlet />;
};
