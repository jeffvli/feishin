import { useMemo, useEffect } from 'react';
import { Center } from '@mantine/core';
import isElectron from 'is-electron';
import { Navigate, Outlet } from 'react-router-dom';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useSetPlayerFallback } from '/@/renderer/store';
import { Spinner, toast } from '/@/renderer/components';
import { useServerAuthenticated } from '/@/renderer/hooks/use-server-authenticated';
import { AuthState } from '/@/renderer/types';

const ipc = isElectron() ? window.electron.ipc : null;
const utils = isElectron() ? window.electron.utils : null;
const mpvPlayerListener = isElectron() ? window.electron.mpvPlayerListener : null;

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
