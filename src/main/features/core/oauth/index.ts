import { app, ipcMain } from 'electron';
import path from 'node:path';

import { attachAccessTokenToAssetRequests } from './intercept_http_request';
import { deleteRefreshToken, getRefreshToken, storeRefreshToken } from './refresh-token-store';

import { getMainWindow } from '/@/main/index';
import { OAuthRedirectScheme } from '/@/shared/types/domain-types';

ipcMain.handle('oauth-attach-token', (_event, audienceEndpoint: string, accessToken: string) => {
    attachAccessTokenToAssetRequests(audienceEndpoint, accessToken);
});

ipcMain.handle('oauth-store-refresh-token', async (_event, key: string, refreshToken: string) => {
    await storeRefreshToken(key, refreshToken);
});

ipcMain.handle('oauth-get-refresh-token', async (_event, key: string) => {
    return await getRefreshToken(key);
});

ipcMain.handle('oauth-delete-refresh-token', async (_event, key: string) => {
    return await deleteRefreshToken(key);
});

app.on('open-url', (_event, url) => {
    if (url.startsWith(OAuthRedirectScheme)) {
        getMainWindow()?.webContents.send('oauth-callback-url', url);
    }
});

app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith(OAuthRedirectScheme));
    if (url) {
        getMainWindow()?.webContents.send('oauth-callback-url', url);
    }
});

const gotLock = app.requestSingleInstanceLock();

app.whenReady().then(() => {
    // Setup app callback protocol
    if (!gotLock) {
        throw new Error('Failed to acquire single instance lock for OIDC/OAuth2 callback handling');
    }

    if (process.defaultApp) {
        // In development mode, the app is run with `electron .` and not packaged
        app.setAsDefaultProtocolClient(OAuthRedirectScheme, process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    } else {
        app.setAsDefaultProtocolClient(OAuthRedirectScheme);
    }
});
