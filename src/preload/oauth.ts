import { ipcRenderer } from 'electron';

import {
    IssuerDiscoveryResponse,
    OAuthAuthenticationConfig,
    OIDCLoginResponse,
} from '../shared/types/domain-types';
export const oauth = {
    attachAccessTokenToRequests: (audienceEndpoint: string, accessToken: string): void => {
        ipcRenderer.invoke('oauth:attach-token', audienceEndpoint, accessToken);
    },
    autoDiscoverIssuerUrl: (url: string): Promise<IssuerDiscoveryResponse> =>
        ipcRenderer.invoke('oauth:auto-discover-issuer-url', url),
    cancelSSOLogin: (): void => {
        ipcRenderer.send('oauth:cancel-sso-login');
        ipcRenderer.removeAllListeners('oauth:callback');
    },
    discoverIssuer: (url: string): Promise<IssuerDiscoveryResponse> =>
        ipcRenderer.invoke('oauth:discover', url),
    externalPageOpenedCallback: (callback: () => void): void => {
        ipcRenderer.on('oauth:external-page-opened', () => {
            callback();
        });
    },
    login: (authConfig: OAuthAuthenticationConfig, audienceEndpoint: string) =>
        ipcRenderer.invoke('oauth:login', authConfig, audienceEndpoint),
    oauthCallback: (callback: (loginResponse: OIDCLoginResponse) => void): void => {
        ipcRenderer.once('oauth:callback', (_event, loginResponse: OIDCLoginResponse) => {
            callback(loginResponse);
        });
    },
    oauthCallbackError: (callback: () => void): void => {
        ipcRenderer.once('oauth:endLogin', () => {
            callback();
        });
    },
    refreshAccessToken: (
        refreshTokenKey: string,
        authConfig: OAuthAuthenticationConfig,
        audienceEndpoint: string,
    ): Promise<null | string> =>
        ipcRenderer.invoke(
            'oauth:refresh-access-token',
            refreshTokenKey,
            authConfig,
            audienceEndpoint,
        ),
    removeOAuthListeners: (): void => {
        ipcRenderer.removeAllListeners('oauth:external-page-opened');
        ipcRenderer.removeAllListeners('oauth:callback');
        ipcRenderer.removeAllListeners('oauth:endLogin');
    },
    revokeRefreshToken: (
        refreshTokenKey: string,
        authConfig: OAuthAuthenticationConfig,
    ): Promise<void> =>
        ipcRenderer.invoke('oauth:revoke-refresh-token', refreshTokenKey, authConfig),
};
