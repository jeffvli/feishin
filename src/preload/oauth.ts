import { ipcRenderer } from 'electron';
import { CreateSigninRequestArgs, OidcClientSettings, SigninResponse } from 'oidc-client-ts';

import { OAuthDiscoveryResponse } from '../shared/types/domain-types';

export const oauth = {
    cancelSSOLogin: (): void => {
        ipcRenderer.invoke('oauth:cancel-sso-login');
    },
    deleteRefreshToken: (serverId: string): Promise<void> =>
        ipcRenderer.invoke('oauth:delete-refresh-token', serverId),
    discover: (url: string): Promise<OAuthDiscoveryResponse> =>
        ipcRenderer.invoke('oauth:discover', url),
    externalPageOpenedCallback: (callback: () => void): void => {
        ipcRenderer.on('oauth:external-page-opened', () => {
            callback();
        });
    },
    getRefreshToken: (serverId: string): Promise<null | string> =>
        ipcRenderer.invoke('oauth:get-refresh-token', serverId),
    login: (
        clientSettings: OidcClientSettings,
        signinArgs: CreateSigninRequestArgs = {},
    ): Promise<SigninResponse> => ipcRenderer.invoke('oauth:login', clientSettings, signinArgs),
    oauthCallback: (callback: (signinResponse: SigninResponse) => void): void => {
        ipcRenderer.on('oauth:callback', (_event, signinResponse: SigninResponse) => {
            callback(signinResponse);
        });
    },
    oauthCallbackError: (callback: () => void): void => {
        ipcRenderer.on('oauth:callbackError', () => {
            callback();
        });
    },
    storeRefreshToken: (serverId: string, refreshToken: string): Promise<void> =>
        ipcRenderer.invoke('oauth:store-refresh-token', serverId, refreshToken),
};
