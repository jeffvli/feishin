import { useEffect, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router';
import { shallow } from 'zustand/shallow';

import { normalizeServerUrl } from '/@/renderer/features/action-required/utils/server-lock';
import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStore, useAuthStoreActions } from '/@/renderer/store';

export const AppOutlet = () => {
    const currentServer = useAuthStore(
        (state) =>
            state.currentServer
                ? {
                      id: state.currentServer.id,
                      url: state.currentServer.url,
                  }
                : null,
        shallow,
    );
    const { setCurrentServer, updateServer } = useAuthStoreActions();

    const hasServerLockMismatch = useMemo(() => {
        if (!isServerLock() || !currentServer || !window.SERVER_URL) {
            return false;
        }

        const configuredUrl = normalizeServerUrl(window.SERVER_URL);
        const persistedUrl = normalizeServerUrl(currentServer.url);

        return configuredUrl !== persistedUrl;
    }, [currentServer]);

    useEffect(() => {
        if (hasServerLockMismatch && currentServer && window.SERVER_URL) {
            updateServer(currentServer.id, {
                url: normalizeServerUrl(window.SERVER_URL),
            });
            setCurrentServer(null);
        }
    }, [currentServer, hasServerLockMismatch, setCurrentServer, updateServer]);

    const isActionsRequired = !currentServer || hasServerLockMismatch;

    if (isActionsRequired) {
        return <Navigate replace to={AppRoute.ACTION_REQUIRED} />;
    }

    return <Outlet />;
};
