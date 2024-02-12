import { useMemo, useEffect } from 'react';
import isElectron from 'is-electron';
import { Navigate, Outlet } from 'react-router-dom';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { toast } from '/@/renderer/components';

const ipc = isElectron() ? window.electron.ipc : null;
const utils = isElectron() ? window.electron.utils : null;

export const AppOutlet = () => {
    const currentServer = useCurrentServer();

    const isActionsRequired = useMemo(() => {
        const isServerRequired = !currentServer;

        const actions = [isServerRequired];
        const isActionRequired = actions.some((c) => c);

        return isActionRequired;
    }, [currentServer]);

    useEffect(() => {
        utils?.mainMessageListener((_event, data) => {
            toast.show(data);
        });

        return () => {
            ipc?.removeAllListeners('toast-from-main');
        };
    }, []);

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
