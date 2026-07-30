import { OidcClientSettings, SigninResponse } from 'oidc-client-ts';

import { discoverIssuer } from '../../shared/utils/oauth';

import { OAuthRedirectScheme } from '/@/shared/types/domain-types';

export const handleOAuth = async (
    url: string,
    issuerUrl: string,
    clientId: string,
): Promise<SigninResponse> => {
    const issuerDetails = issuerUrl
        ? await discoverIssuer(issuerUrl)
        : await window.api.oauth.discover(url);

    if (!issuerDetails.found) {
        throw new Error(
            'Failed to discover OIDC/OAuth2 metadata. Please provide a valid Issuer URL.',
        );
    }

    const clientSettings: OidcClientSettings = {
        authority: issuerDetails.issuer ?? '',
        client_id: clientId,
        metadataUrl: issuerDetails.metadataEndpoint ?? undefined,
        redirect_uri: `${OAuthRedirectScheme}://callback`,
        response_type: 'code',
        scope: 'openid profile email',
    };

    function onOauthCallback(): Promise<SigninResponse> {
        return new Promise<SigninResponse>((resolve) => {
            window.api.oauth.oauthCallback((signinResponse) => {
                resolve(signinResponse);
            });
        });
    }

    const signinResponse = onOauthCallback();

    await window.api.oauth.login(clientSettings);

    if (!signinResponse) {
        throw new Error('Failed to sign-in with SSO');
    }
    return signinResponse;
};

export const storeRefreshToken = async (serverId: string, refreshToken: string): Promise<void> => {
    await window.api.oauth.storeRefreshToken(serverId, refreshToken);
};

export const getRefreshToken = async (serverId: string): Promise<null | string> => {
    const refreshToken = await window.api.oauth.getRefreshToken(serverId);
    return refreshToken;
};

export const deleteRefreshToken = async (serverId: string): Promise<void> => {
    await window.api.oauth.deleteRefreshToken(serverId);
};
