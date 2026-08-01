import { OidcClientSettings, SigninResponse } from 'oidc-client-ts';

import i18n from '/@/i18n/i18n';
import {
    IssuerDiscoveryResponse,
    OAuthRedirectScheme,
    ServerListItem,
} from '/@/shared/types/domain-types';
import { formatRefreshTokenKey } from '/@/shared/utils/oauth-format-refresh-token-key';

export const reauthenticateOAuth = async (
    currentServer: ServerListItem,
): Promise<SigninResponse> => {
    const { clientSettings } = createClientSettingsAndKey(currentServer);

    const signinResponse = await signinSSO(clientSettings, currentServer.url);
    return signinResponse;
};

export const handleInitialOAuth = async (
    url: string,
    clientId: string,
    issuerUrl?: string,
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

    return signinSSO(clientSettings, url);
};

// Setups a listener for callback and errors events from main process
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

export const signinSSO = async (
    clientSettings: OidcClientSettings,
    audienceEndpoint: string,
): Promise<SigninResponse> => {
    const signinResponse = onOauthCallback();

    // Hands off to main process to open the external browser for SSO login
    await window.api.oauth.login(clientSettings, audienceEndpoint);

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

export const refreshAccessToken = async (currentServer: ServerListItem): Promise<string> => {
    const { clientSettings, refreshTokenKey } = createClientSettingsAndKey(currentServer);

    const access_token = await window.api.oauth.refreshAccessToken(
        refreshTokenKey,
        clientSettings,
        currentServer.url,
    );
    if (!access_token) {
        throw new Error(i18n.t('error.ssoError'));
    }
    return access_token;
};

export const revokeRefreshToken = async (currentServer: ServerListItem): Promise<void> => {
    const { clientSettings, refreshTokenKey } = createClientSettingsAndKey(currentServer);
    await window.api.oauth.revokeRefreshToken(refreshTokenKey, clientSettings);
};

const createClientSettingsAndKey = (
    currentServer: ServerListItem,
): { clientSettings: OidcClientSettings; refreshTokenKey: string } => {
    if (!currentServer.issuerUrl || !currentServer.clientId || !currentServer.userId) {
        throw new Error(i18n.t('error.invalidServer'));
    }
    const refreshTokenKey = formatRefreshTokenKey(
        currentServer.userId,
        currentServer.issuerUrl,
        currentServer.clientId,
    );
    const clientSettings: OidcClientSettings = {
        authority: currentServer.issuerUrl,
        client_id: currentServer.clientId,
        redirect_uri: `${OAuthRedirectScheme}://callback`,
        response_type: 'code',
        scope: 'openid profile email',
    };
    return { clientSettings, refreshTokenKey };
};
