import { ipcRenderer } from 'electron';
import { CreateSigninRequestArgs, OidcClientSettings, SigninResponse } from 'oidc-client-ts';

import { IssuerDiscoveryResponse } from '../shared/types/domain-types';

export const oauth = {
    attachAccessTokenToRequests: (audienceEndpoint: string, accessToken: string): void => {
        ipcRenderer.invoke('oauth:attach-token', audienceEndpoint, accessToken);
    },
    autoDiscoverIssuerUrl: (url: string): Promise<IssuerDiscoveryResponse> =>
        ipcRenderer.invoke('oauth:auto-discover-issuer-url', url),
    cancelSSOLogin: (): void => {
        ipcRenderer.invoke('oauth:cancel-sso-login');
    },
    discoverIssuer: (url: string): Promise<IssuerDiscoveryResponse> =>
        ipcRenderer.invoke('oauth:discover', url),
    externalPageOpenedCallback: (callback: () => void): void => {
        ipcRenderer.on('oauth:external-page-opened', () => {
            callback();
        });
    },
    login: (
        clientSettings: OidcClientSettings,
        audienceEndpoint: string,
        signinArgs: CreateSigninRequestArgs = {},
    ): Promise<SigninResponse> =>
        ipcRenderer.invoke('oauth:login', clientSettings, audienceEndpoint, signinArgs),
    oauthCallback: (callback: (signinResponse: SigninResponse) => void): void => {
        ipcRenderer.on('oauth:callback', (_event, signinResponse: SigninResponse) => {
            callback(signinResponse);
        });
    },
    oauthCallbackError: (callback: () => void): void => {
        ipcRenderer.on('oauth:endLogin', () => {
            callback();
        });
    },
    refreshAccessToken: (
        serverId: string,
        clientSettings: OidcClientSettings,
        audienceEndpoint: string,
    ): Promise<null | string> =>
        ipcRenderer.invoke(
            'oauth:refresh-access-token',
            serverId,
            clientSettings,
            audienceEndpoint,
        ),
    removeOAuthListeners: (): void => {
        ipcRenderer.removeAllListeners('oauth:external-page-opened');
        ipcRenderer.removeAllListeners('oauth:callback');
        ipcRenderer.removeAllListeners('oauth:endLogin');
    },
    revokeRefreshToken: (serverId: string, clientSettings: OidcClientSettings): Promise<void> =>
        ipcRenderer.invoke('oauth:revoke-refresh-token', serverId, clientSettings),
};
