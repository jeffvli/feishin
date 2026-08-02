import { ipcMain } from 'electron';

import { discoverIssuer } from './oidc-discover-issuer';
import { oidcLogin } from './oidc-login';
import { refreshAccessToken, revokeRefreshToken } from './refresh-token-store';
import { autoDiscoverIssuerFromServerUrl as autoDiscoverIssuerUrl } from './wellknown-discovery';

import { attachAccessTokenToAssetRequests } from '/@/main/features/oauth/intercept_http_request';
import { OAuthAuthenticationConfig } from '/@/shared/types/domain-types';

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
