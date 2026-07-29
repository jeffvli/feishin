import { app, ipcMain, shell } from 'electron';
import { CreateSigninRequestArgs, OidcClient, OidcClientSettings } from 'oidc-client-ts';

import { deleteRefreshToken, getRefreshToken, storeRefreshToken } from './oidc-refresh-token-store';
import { discoverIssuer } from './oidc-wellknown-discovery';

import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';
import { OIDCRedirectScheme } from '/@/shared/types/domain-types';

app.setAsDefaultProtocolClient(OIDCRedirectScheme);

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
        log.info(`Opening OIDC login URL: ${url}`);
        if (!app.requestSingleInstanceLock()) {
            throw new Error('Failed to acquire single instance lock for OIDC login');
        }

        app.once('open-url', async (_event, url) => {
            if (url.startsWith(`${OIDCRedirectScheme}://`)) {
                // Send the redirect URL to the renderer process for handling
                const signinResponse = await oidcClient.processSigninResponse(url);
                getMainWindow()?.webContents.send('oidc:callback', signinResponse);
            }
        });

        app.once('second-instance', async (_event, argv) => {
            const url = argv.find((arg) => arg.startsWith(`${OIDCRedirectScheme}://`));
            if (url) {
                // Send the redirect URL to the renderer process for handling
                const signinResponse = await oidcClient.processSigninResponse(url);
                getMainWindow()?.webContents.send('oidc:callback', signinResponse);
            }
        });

        await shell.openExternal(url);
    },
);

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
