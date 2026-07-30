import { app, ipcMain, shell } from 'electron';
import path from 'node:path';
import { CreateSigninRequestArgs, OidcClient, OidcClientSettings } from 'oidc-client-ts';

import { autoDiscoverIssuerFromServerUrl as autoDiscoverIssuerUrl } from './oauth-oidc-wellknown-discovery';
import {
    deleteRefreshToken,
    getRefreshToken,
    storeRefreshToken,
} from './oauth-refresh-token-store';

import { discoverIssuer } from '/@/main/features/oauth/oauth-oidc-discover-issuer';
import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';
import { OAuthRedirectScheme } from '/@/shared/types/domain-types';

const gotLock = app.requestSingleInstanceLock();

let oidcClient: OidcClient;

const openUrlListener = async (_event: Electron.Event, url: string) => {
    if (url.startsWith(`${OAuthRedirectScheme}://`)) {
        processSigninResponse(url);
    }
};
const secondInstanceListener = async (_event: Electron.Event, argv: string[]) => {
    const url = argv.find((arg) => arg.startsWith(`${OAuthRedirectScheme}://`));
    if (url) {
        processSigninResponse(url);
    }
};

const processSigninResponse = async (url: string) => {
    log.info(`Received OIDC/OAuth2 callback URL`);
    clearListeners();
    try {
        const signinResponse = await oidcClient.processSigninResponse(url);
        getMainWindow()?.webContents.send('oauth:callback', signinResponse);
    } catch (error) {
        log.error('Failed to process OIDC/OAuth2 signin response:', error);
        getMainWindow()?.webContents.send('oauth:callbackError');
    }
};

const clearListeners = () => {
    app.removeListener('open-url', openUrlListener);
    app.removeListener('second-instance', secondInstanceListener);
};

ipcMain.handle(
    'oauth:login',
    async (_event, clientSettings: OidcClientSettings, signinArgs: CreateSigninRequestArgs) => {
        oidcClient = new OidcClient(clientSettings);
        log.info('Creating OIDC/OAuth2 signin request');
        try {
            const signinRequest = await oidcClient.createSigninRequest(signinArgs);

            if (!signinRequest) {
                throw new Error('Failed to create OIDC/OAuth2 signin request');
            }

            const url = signinRequest.url;
            log.info(`Opening OIDC/OAuth2 login URL`);

            if (!gotLock) {
                throw new Error(
                    'Failed to acquire single instance lock for OIDC/OAuth2 callback handling',
                );
            }

            if (process.defaultApp) {
                // Dev mode handling
                app.setAsDefaultProtocolClient(OAuthRedirectScheme, process.execPath, [
                    path.resolve(process.argv[1]),
                ]);
            } else {
                // Prod handling
                app.setAsDefaultProtocolClient(OAuthRedirectScheme);
            }

            app.once('open-url', openUrlListener);
            app.once('second-instance', secondInstanceListener);

            await shell.openExternal(url);
            getMainWindow()?.webContents.send('oauth:external-page-opened');
        } catch (error) {
            log.error('Failed to create OIDC/OAuth2 signin request:', error);
            getMainWindow()?.webContents.send('oauth:callbackError');
        }
    },
);

ipcMain.handle('oauth:cancel-sso-login', () => {
    log.info('Cancelling SSO login');
    getMainWindow()?.webContents.send('oauth:callbackError');
    // Remove all listeners for 'open-url' and 'second-instance' events
    clearListeners();
});

ipcMain.handle('oauth:discover', async (_event, url: string) => {
    return await discoverIssuer(url);
});

ipcMain.handle('oauth:auto-discover-issuer-url', autoDiscoverIssuerUrl);

ipcMain.handle('oauth:store-refresh-token', (_event, serverId: string, refreshToken: string) => {
    storeRefreshToken(serverId, refreshToken);
});

ipcMain.handle('oauth:get-refresh-token', (_event, serverId: string) => {
    return getRefreshToken(serverId);
});

ipcMain.handle('oauth:delete-refresh-token', (_event, serverId: string) => {
    deleteRefreshToken(serverId);
});
