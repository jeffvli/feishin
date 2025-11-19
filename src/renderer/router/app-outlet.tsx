import { NuqsAdapter } from '@offlegacy/nuqs-hash-router';
import isElectron from 'is-electron';
import { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router';

import { useServerAuthenticated } from '/@/renderer/hooks/use-server-authenticated';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { AuthState } from '/@/shared/types/types';

const localSettings = isElectron() ? window.api.localSettings : null;

export const AppOutlet = () => {
    const currentServer = useCurrentServer();
    const authState = useServerAuthenticated();

    const serverLock = localSettings?.env.SERVER_LOCK || false;

    const isActionsRequired = useMemo(() => {
        const isServerRequired = !currentServer;

        const actions = [isServerRequired];
        const isActionRequired = actions.some((c) => c);

        return isActionRequired;
    }, [currentServer]);

    if (authState === AuthState.LOADING) {
        return (
            <Center h="100vh" w="100%">
                <Spinner container />
            </Center>
        );
    }

    if (serverLock && !currentServer) {
        return <Navigate replace to={AppRoute.LOGIN} />;
    }

    if (isActionsRequired || authState === AuthState.INVALID) {
        return <Navigate replace to={AppRoute.ACTION_REQUIRED} />;
    }

    return (
        <NuqsAdapter>
            <Outlet />
        </NuqsAdapter>
    );
};
