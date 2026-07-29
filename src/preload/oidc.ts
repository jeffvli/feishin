import { ipcRenderer } from 'electron';
import { CreateSigninRequestArgs, OidcClientSettings, SigninResponse } from 'oidc-client-ts';

import { OIDCConfigResponse } from '/@/shared/types/domain-types';

export const oidc = {
    deleteRefreshToken: (serverId: string): Promise<void> =>
        ipcRenderer.invoke('oidc:delete-refresh-token', serverId),
    discover: (url: string): Promise<OIDCConfigResponse> =>
        ipcRenderer.invoke('oidc:discover', url),
    getRefreshToken: (serverId: string): Promise<null | string> =>
        ipcRenderer.invoke('oidc:get-refresh-token', serverId),
    login: (
        clientSettings: OidcClientSettings,
        signinArgs: CreateSigninRequestArgs = {},
    ): Promise<SigninResponse> => ipcRenderer.invoke('oidc:login', clientSettings, signinArgs),
    oidcCallback: (callback: (signinResponse: SigninResponse) => void): void => {
        ipcRenderer.on('oidc:callback', (_event, signinResponse: SigninResponse) => {
            callback(signinResponse);
        });
    },
    storeRefreshToken: (serverId: string, refreshToken: string): Promise<void> =>
        ipcRenderer.invoke('oidc:store-refresh-token', serverId, refreshToken),
};
