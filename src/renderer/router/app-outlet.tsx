import { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router';

import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useCurrentServer } from '/@/renderer/store';

const normalizeUrl = (url: string) => url.replace(/\/$/, '');

export const AppOutlet = () => {
    const currentServer = useCurrentServer();
    const { deleteServer, setCurrentServer } = useAuthStoreActions();

    const isActionsRequired = useMemo(() => {
        // When SERVER_LOCK is enabled and the configured URL has changed,
        // clear the stale session so the user re-authenticates against the new server.
        if (isServerLock() && currentServer && window.SERVER_URL) {
            const configuredUrl = normalizeUrl(window.SERVER_URL);
            const persistedUrl = normalizeUrl(currentServer.url);

            if (configuredUrl !== persistedUrl) {
                deleteServer(currentServer.id);
                setCurrentServer(null);
                return true;
            }
        }

        const isServerRequired = !currentServer;

        const actions = [isServerRequired];
        const isActionRequired = actions.some((c) => c);

        return isActionRequired;
    }, [currentServer, deleteServer, setCurrentServer]);

    if (isActionsRequired) {
        return <Navigate replace to={AppRoute.ACTION_REQUIRED} />;
    }

    return <Outlet />;
};
