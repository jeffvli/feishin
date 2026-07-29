import { app, ipcMain, shell } from 'electron';
import path from 'node:path';
import { CreateSigninRequestArgs, OidcClient, OidcClientSettings } from 'oidc-client-ts';

import { deleteRefreshToken, getRefreshToken, storeRefreshToken } from './oidc-refresh-token-store';
import { discoverIssuer } from './oidc-wellknown-discovery';

import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';
import { OIDCRedirectScheme } from '/@/shared/types/domain-types';

const gotLock = app.requestSingleInstanceLock();

let openUrlListener: (_event: Electron.Event, url: string) => Promise<void>;
let secondInstanceListener: (_event: Electron.Event, argv: string[]) => Promise<void>;

ipcMain.handle(
    'oidc:login',
    async (_event, clientSettings: OidcClientSettings, signinArgs: CreateSigninRequestArgs) => {
        const oidcClient = new OidcClient(clientSettings);
        log.info('Creating OIDC signin request');
        const signinRequest = await oidcClient.createSigninRequest(signinArgs);

        if (!signinRequest) {
            throw new Error('Failed to create OIDC signin request');
        }

        const url = signinRequest.url;
        log.info(`Opening OIDC login URL`);

        if (!gotLock) {
            throw new Error('Failed to acquire single instance lock for OIDC login');
        }

        if (process.defaultApp) {
            // Dev mode handling
            app.setAsDefaultProtocolClient(OIDCRedirectScheme, process.execPath, [
                path.resolve(process.argv[1]),
            ]);
        } else {
            // Prod handling
            app.setAsDefaultProtocolClient(OIDCRedirectScheme);
        }

        openUrlListener = async (_event: Electron.Event, url: string) => {
            if (url.startsWith(`${OIDCRedirectScheme}://`)) {
                log.info(`Received OIDC callback URL`);
                app.removeListener('second-instance', secondInstanceListener);
                const signinResponse = await oidcClient.processSigninResponse(url);
                getMainWindow()?.webContents.send('oidc:callback', signinResponse);
            }
        };

        secondInstanceListener = async (_event: Electron.Event, argv: string[]) => {
            const url = argv.find((arg) => arg.startsWith(`${OIDCRedirectScheme}://`));
            if (url) {
                log.info(`Received OIDC callback URL`);
                app.removeListener('open-url', openUrlListener);
                const signinResponse = await oidcClient.processSigninResponse(url);
                getMainWindow()?.webContents.send('oidc:callback', signinResponse);
            }
        };

        app.once('open-url', openUrlListener);
        app.once('second-instance', secondInstanceListener);

        await shell.openExternal(url);
        getMainWindow()?.webContents.send('oidc:external-page-opened');
    },
);

ipcMain.handle('oidc:cancel-sso-login', () => {
    log.info('Cancelling SSO login');
    // Remove all listeners for 'open-url' and 'second-instance' events
    app.removeListener('open-url', openUrlListener);
    app.removeListener('second-instance', secondInstanceListener);
    openUrlListener = undefined;
    secondInstanceListener = undefined;
});

ipcMain.handle('oidc:discover', discoverIssuer);

ipcMain.handle('oidc:store-refresh-token', (_event, serverId: string, refreshToken: string) => {
    storeRefreshToken(serverId, refreshToken);
});

ipcMain.handle('oidc:get-refresh-token', (_event, serverId: string) => {
    return getRefreshToken(serverId);
});

ipcMain.handle('oidc:delete-refresh-token', (_event, serverId: string) => {
    deleteRefreshToken(serverId);
});
