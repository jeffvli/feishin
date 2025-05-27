import isElectron from 'is-electron';
import { useEffect, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useServerAuthenticated } from '/@/renderer/hooks/use-server-authenticated';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useSetPlayerFallback } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { toast } from '/@/shared/components/toast/toast';
import { AuthState } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;
const utils = isElectron() ? window.api.utils : null;
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;

export const AppOutlet = () => {
    const currentServer = useCurrentServer();
    const setFallback = useSetPlayerFallback();
    const authState = useServerAuthenticated();

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

        mpvPlayerListener?.rendererPlayerFallback((_event, data) => {
            setFallback(data);
        });

        return () => {
            ipc?.removeAllListeners('toast-from-main');
            ipc?.removeAllListeners('renderer-player-fallback');
        };
    }, [setFallback]);

    if (authState === AuthState.LOADING) {
        return (
            <Center
                h="100vh"
                w="100%"
            >
                <Spinner container />
            </Center>
        );
    }

    if (isActionsRequired || authState === AuthState.INVALID) {
        return (
            <Navigate
                replace
                to={AppRoute.ACTION_REQUIRED}
            />
        );
    }

    return <Outlet />;
};
