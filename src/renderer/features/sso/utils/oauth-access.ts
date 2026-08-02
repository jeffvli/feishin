import i18n from '/@/i18n/i18n';
import {
    IssuerDiscoveryResponse,
    OAuthAuthenticationConfig,
    OAuthLoginResponse,
    ServerListItem,
} from '/@/shared/types/domain-types';
import { formatRefreshTokenKey } from '/@/shared/utils/oauth-format-refresh-token-key';

export const reauthenticateOAuth = async (
    currentServer: ServerListItem,
): Promise<OAuthLoginResponse> => {
    const { authConfig } = createConfigAndRefreshTokenKey(currentServer);

    const signinResponse = await signinSSO(authConfig, currentServer.url);
    return signinResponse;
};

export const handleInitialOAuth = async (
    url: string,
    clientId: string,
    issuerUrl?: string,
): Promise<OAuthLoginResponse> => {
    const issuerDetails: IssuerDiscoveryResponse = await getIssuerDetails(url, issuerUrl);

    if (!issuerDetails.issuer || !issuerDetails.metadataEndpoint) {
        throw new Error(i18n.t('error.ssoDiscoveryFailureError'));
    }

    const authConfig: OAuthAuthenticationConfig = {
        clientId: clientId,
        issuerUrl: issuerDetails.issuer,
    };

    return signinSSO(authConfig, url);
};

// Setups a listener for callback and errors events from main process
export const onOauthCallback = (): Promise<OAuthLoginResponse> => {
    return new Promise<OAuthLoginResponse>((resolve, reject) => {
        window.api.oauth.oauthCallback((loginResponse: OAuthLoginResponse) => {
            resolve(loginResponse);
        });

        window.api.oauth.oauthCallbackError(() => {
            reject(new Error(i18n.t('error.ssoError')));
        });
    });
};

export const signinSSO = async (
    authConfig: OAuthAuthenticationConfig,
    audienceEndpoint: string,
): Promise<OAuthLoginResponse> => {
    const tokenResponse = onOauthCallback();

    // Hands off to main process to open the external browser for SSO login
    await window.api.oauth.login(authConfig, audienceEndpoint);

    if (!tokenResponse) {
        throw new Error(i18n.t('error.ssoError'));
    }
    return tokenResponse;
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
    const { authConfig, refreshTokenKey } = createConfigAndRefreshTokenKey(currentServer);

    const access_token = await window.api.oauth.refreshAccessToken(
        refreshTokenKey,
        authConfig,
        currentServer.url,
    );
    if (!access_token) {
        throw new Error(i18n.t('error.ssoError'));
    }
    return access_token;
};

export const revokeRefreshToken = async (currentServer: ServerListItem): Promise<void> => {
    const { authConfig, refreshTokenKey } = createConfigAndRefreshTokenKey(currentServer);
    await window.api.oauth.revokeRefreshToken(refreshTokenKey, authConfig);
};

const createConfigAndRefreshTokenKey = (
    currentServer: ServerListItem,
): { authConfig: OAuthAuthenticationConfig; refreshTokenKey: string } => {
    if (!currentServer.issuerUrl || !currentServer.clientId || !currentServer.userId) {
        throw new Error(i18n.t('error.invalidServer'));
    }
    const refreshTokenKey = formatRefreshTokenKey(
        currentServer.userId,
        currentServer.issuerUrl,
        currentServer.clientId,
    );
    const authConfig: OAuthAuthenticationConfig = {
        clientId: currentServer.clientId,
        issuerUrl: currentServer.issuerUrl,
    };
    return { authConfig, refreshTokenKey };
};
