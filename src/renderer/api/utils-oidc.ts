import { OidcClientSettings, SigninResponse } from 'oidc-client-ts';

import i18n from '/@/i18n/i18n';
import { IssuerDiscoveryResponse, OAuthRedirectScheme } from '/@/shared/types/domain-types';

export const handleOAuth = async (
    url: string,
    issuerUrl: string,
    clientId: string,
): Promise<SigninResponse> => {
    const issuerDetails: IssuerDiscoveryResponse = await getIssuerDetails(url, issuerUrl);

    if (!issuerDetails.issuer || !issuerDetails.metadataEndpoint) {
        throw new Error(i18n.t('error.ssoDiscoveryFailureError'));
    }

    const clientSettings: OidcClientSettings = {
        authority: issuerDetails.issuer,
        client_id: clientId,
        metadataUrl: issuerDetails.metadataEndpoint,
        redirect_uri: `${OAuthRedirectScheme}://callback`,
        response_type: 'code',
        scope: 'openid profile email',
    };

    function onOauthCallback(): Promise<SigninResponse> {
        return new Promise<SigninResponse>((resolve, reject) => {
            window.api.oauth.oauthCallback((signinResponse) => {
                resolve(signinResponse);
            });

            window.api.oauth.oauthCallbackError(() => {
                reject(new Error(i18n.t('error.ssoError')));
            });
        });
    }

    const signinResponse = onOauthCallback();

    await window.api.oauth.login(clientSettings);

    if (!signinResponse) {
        throw new Error(i18n.t('error.ssoError'));
    }
    return signinResponse;
};

const getIssuerDetails = async (
    url: string,
    issuerUrl?: string,
): Promise<IssuerDiscoveryResponse> => {
    try {
        if (issuerUrl) return await window.api.oauth.discoverIssuer(issuerUrl);
        return await window.api.oauth.autoDiscoverIssuerUrl(url);
    } catch {
        throw new Error(i18n.t('error.ssoDiscoveryFailureError'));
    }
};

export const refreshAccessToken = async (
    serverId: string,
    clientSettings: OidcClientSettings,
): Promise<string> => {
    const access_token = await window.api.oauth.refreshAccessToken(serverId, clientSettings);
    if (!access_token) {
        throw new Error(i18n.t('error.ssoError'));
    }
    return access_token;
};

export const revokeRefreshToken = async (
    serverId: string,
    clientSettings: OidcClientSettings,
): Promise<void> => {
    await window.api.oauth.revokeRefreshToken(serverId, clientSettings);
};
