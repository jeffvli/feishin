import { ipcMain } from 'electron';
import { CreateSigninRequestArgs, OidcClient, OidcClientSettings } from 'oidc-client-ts';

import { autoDiscoverIssuerFromServerUrl as autoDiscoverIssuerUrl } from './oauth-oidc-wellknown-discovery';
import { refreshAccessToken, revokeRefreshToken } from './oauth-refresh-token-store';

import { oauthLogin } from '/@/main/features/oauth/oauth-login';
import { discoverIssuer } from '/@/main/features/oauth/oauth-oidc-discover-issuer';

ipcMain.handle(
    'oauth:login',
    async (_event, clientSettings: OidcClientSettings, signinArgs: CreateSigninRequestArgs) => {
        const oidcClient = new OidcClient(clientSettings);
        await oauthLogin(oidcClient, signinArgs);
    },
);

ipcMain.handle('oauth:discover', async (_event, url: string) => {
    return await discoverIssuer(url);
});

ipcMain.handle('oauth:auto-discover-issuer-url', autoDiscoverIssuerUrl);

ipcMain.handle(
    'oauth:refresh-access-token',
    async (_event, serverId: string, clientSettings: OidcClientSettings) => {
        return await refreshAccessToken(serverId, clientSettings);
    },
);

ipcMain.handle(
    'oauth:revoke-refresh-token',
    async (_event, serverId: string, clientSettings: OidcClientSettings) => {
        await revokeRefreshToken(serverId, clientSettings);
    },
);
