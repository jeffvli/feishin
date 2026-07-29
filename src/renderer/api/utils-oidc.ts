import { OidcClient, SigninResponse } from 'oidc-client-ts';

import { OIDCRedirectScheme } from '/@/shared/types/domain-types';
import { discoverOIDCConfig } from '/@/shared/utils/oidc';

export const handleOIDCAuth = async (
    url: string,
    issuerUrl: string,
    clientId: string,
): Promise<SigninResponse> => {
    const oidcDetails = issuerUrl
        ? await discoverOIDCConfig(issuerUrl)
        : await window.api.oidc.discover(url);

    if (!oidcDetails.found) {
        throw new Error('Failed to discover OIDC configuration');
    }

    const authority = oidcDetails.issuer || issuerUrl;
    const clientSettings = {
        authority: authority,
        client_id: clientId,
        redirect_uri: `${OIDCRedirectScheme}://callback`,
        response_type: 'code',
        scope: 'openid profile email',
    };

    function onOIDCCallback(): Promise<SigninResponse> {
        return new Promise<SigninResponse>((resolve) => {
            window.api.oidc.oidcCallback((signinResponse) => {
                resolve(signinResponse);
            });
        });
    }

    const signinResponse = onOIDCCallback();

    await window.api.oidc.login(clientSettings);

    if (!signinResponse) {
        throw new Error('Failed to process OIDC signin request');
    }
    return signinResponse;
};

export const storeOIDCRefreshToken = async (
    serverId: string,
    refreshToken: string,
): Promise<void> => {
    await window.api.oidc.storeRefreshToken(serverId, refreshToken);
};

export const getOIDCRefreshToken = async (serverId: string): Promise<null | string> => {
    const refreshToken = await window.api.oidc.getRefreshToken(serverId);
    return refreshToken;
};

export const deleteOIDCRefreshToken = async (serverId: string): Promise<void> => {
    await window.api.oidc.deleteRefreshToken(serverId);
};
