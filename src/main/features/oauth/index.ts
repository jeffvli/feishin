import { ipcMain } from 'electron';
import { CreateSigninRequestArgs, OidcClient, OidcClientSettings } from 'oidc-client-ts';

import { autoDiscoverIssuerFromServerUrl as autoDiscoverIssuerUrl } from './oauth-oidc-wellknown-discovery';
import { refreshAccessToken, revokeRefreshToken } from './oauth-refresh-token-store';

import { attachAccessTokenToAssetRequests } from '/@/main/features/oauth/intercept_http_request';
import { oauthLogin } from '/@/main/features/oauth/oauth-login';
import { discoverIssuer } from '/@/main/features/oauth/oauth-oidc-discover-issuer';

ipcMain.handle(
    'oauth:login',
    async (
        _event,
        clientSettings: OidcClientSettings,
        audienceEndpoint: string,
        signinArgs: CreateSigninRequestArgs,
    ) => {
        const oidcClient = new OidcClient(clientSettings);
        await oauthLogin(oidcClient, audienceEndpoint, signinArgs);
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
        clientSettings: OidcClientSettings,
        audienceEndpoint: string,
    ) => {
        return await refreshAccessToken(refreshTokenKey, clientSettings, audienceEndpoint);
    },
);

ipcMain.handle(
    'oauth:revoke-refresh-token',
    async (_event, serverId: string, clientSettings: OidcClientSettings) => {
        await revokeRefreshToken(serverId, clientSettings);
    },
);

ipcMain.handle('oauth:attach-token', (_event, audienceEndpoint: string, accessToken: string) => {
    attachAccessTokenToAssetRequests(audienceEndpoint, accessToken);
});
