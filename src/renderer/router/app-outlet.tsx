import { useEffect, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router';
import { shallow } from 'zustand/shallow';

import { normalizeServerUrl } from '/@/renderer/features/action-required/utils/server-lock';
import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStore, useAuthStoreActions } from '/@/renderer/store';
import { ServerType } from '/@/shared/types/domain-types';
import { AuthType } from '/@/shared/types/types';

export const AppOutlet = () => {
    const currentServer = useAuthStore(
        (state) =>
            state.currentServer
                ? {
                      accessToken: state.currentServer.accessToken,
                      authType: state.currentServer.authType,
                      credential: state.currentServer.credential,
                      id: state.currentServer.id,
                      ndCredential: state.currentServer.ndCredential,
                      type: state.currentServer.type,
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

    const isBasicAuth = currentServer?.authType === AuthType.BASIC;

    const missingBasicAuthCredentials =
        isBasicAuth &&
        (!currentServer?.credential ||
            (currentServer?.type === ServerType.NAVIDROME && !currentServer?.ndCredential));
    const missingOAuthCredentials = !isBasicAuth && !currentServer?.accessToken;

    const hasMissingCredentials = Boolean(
        currentServer && (missingBasicAuthCredentials || missingOAuthCredentials),
    );

    useEffect(() => {
        if (hasServerLockMismatch && currentServer && window.SERVER_URL) {
            updateServer(currentServer.id, {
                url: normalizeServerUrl(window.SERVER_URL),
            });
            setCurrentServer(null);
        }
    }, [currentServer, hasServerLockMismatch, setCurrentServer, updateServer]);

    // Clear selection when credentials were wiped but currentServer was left set
    useEffect(() => {
        if (hasMissingCredentials) {
            setCurrentServer(null);
        }
    }, [currentServer?.id, currentServer?.type, hasMissingCredentials, setCurrentServer]);

    const isActionsRequired = !currentServer || hasServerLockMismatch || hasMissingCredentials;

    if (isActionsRequired) {
        return <Navigate replace to={AppRoute.ACTION_REQUIRED} />;
    }

    return <Outlet />;
};
