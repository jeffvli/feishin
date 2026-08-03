import { ipcMain } from 'electron';

import { refreshAccessToken, revokeRefreshToken } from './access-token';
import { attachAccessTokenToAssetRequests } from './intercept_http_request';
import { discoverIssuer } from './oidc-discover-issuer';
import { oidcLogin } from './oidc-login';
import { deleteRefreshToken, getRefreshToken, storeRefreshToken } from './refresh-token-store';
import { autoDiscoverIssuerFromServerUrl as autoDiscoverIssuerUrl } from './wellknown-discovery';

import { OAuthAuthenticationConfig } from '/@/shared/types/domain-types';

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

// TODO: BELOW CODE TO BE MOVED TO RENDERER

ipcMain.handle(
    'oauth:login',
    async (_event, authConfig: OAuthAuthenticationConfig, audienceEndpoint: string) => {
        await oidcLogin(authConfig, audienceEndpoint);
    },
);

ipcMain.handle('oauth:discover', async (_event, url: string) => {
    return await discoverIssuer(url);
});

ipcMain.handle('oauth:auto-discover-issuer-url', autoDiscoverIssuerUrl);

ipcMain.handle(
    'oauth:refresh-access-token',
    async (
        _event,
        refreshTokenKey: string,
        authConfig: OAuthAuthenticationConfig,
        audienceEndpoint: string,
    ) => {
        return await refreshAccessToken(refreshTokenKey, authConfig, audienceEndpoint);
    },
);

ipcMain.handle(
    'oauth:revoke-refresh-token',
    async (_event, refreshTokenKey: string, authConfig: OAuthAuthenticationConfig) => {
        await revokeRefreshToken(refreshTokenKey, authConfig);
    },
);

ipcMain.handle('oauth:attach-token', (_event, audienceEndpoint: string, accessToken: string) => {
    attachAccessTokenToAssetRequests(audienceEndpoint, accessToken);
});
