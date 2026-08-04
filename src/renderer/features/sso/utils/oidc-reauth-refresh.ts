import i18n from '/@/i18n/i18n';
import {
    refreshAccessToken,
    revokeRefreshToken,
} from '/@/renderer/features/sso/api/oidc/access-token';
import { autoDiscoverIssuerUrl } from '/@/renderer/features/sso/api/oidc/auto-wellknown-discovery';
import { discoverIssuer } from '/@/renderer/features/sso/api/oidc/oidc-discover-issuer';
import { oidcLogin } from '/@/renderer/features/sso/api/oidc/oidc-login';
import {
    IssuerDiscoveryResponse,
    OAuthAuthenticationConfig,
    OIDCLoginResponse as OIDCLoginResponse,
    ServerListItem,
} from '/@/shared/types/domain-types';
import { formatRefreshTokenKey } from '/@/shared/utils/oauth-format-refresh-token-key';

export const reloginOIDC = async (currentServer: ServerListItem): Promise<OIDCLoginResponse> => {
    const { authConfig } = createConfigAndRefreshTokenKey(currentServer);

    const signinResponse = await ssoSignIn(authConfig, currentServer.url);
    return signinResponse;
};

export const initalOIDCLogin = async (
    url: string,
    clientId: string,
    issuerUrl?: string,
): Promise<OIDCLoginResponse> => {
    const issuerDetails: IssuerDiscoveryResponse = await getIssuerDetails(url, issuerUrl);

    if (!issuerDetails.issuer || !issuerDetails.metadataEndpoint) {
        throw new Error(i18n.t('error.ssoDiscoveryFailureError'));
    }

    const authConfig: OAuthAuthenticationConfig = {
        clientId: clientId,
        issuerUrl: issuerDetails.issuer,
    };

    return ssoSignIn(authConfig, url);
};

const ssoSignIn = async (
    authConfig: OAuthAuthenticationConfig,
    audienceEndpoint: string,
): Promise<OIDCLoginResponse> => {
    // Perform the OIDC login flow
    const tokenResponse = await oidcLogin(authConfig, audienceEndpoint);

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
        if (issuerUrl) return await discoverIssuer(issuerUrl);
        return await autoDiscoverIssuerUrl(url);
    } catch {
        throw new Error(i18n.t('error.ssoDiscoveryFailureError'));
    }
};

export const refreshServerAccessToken = async (currentServer: ServerListItem): Promise<string> => {
    const { authConfig, refreshTokenKey } = createConfigAndRefreshTokenKey(currentServer);

    const access_token = await refreshAccessToken(refreshTokenKey, authConfig, currentServer.url);
    if (!access_token) {
        throw new Error(i18n.t('error.ssoError'));
    }
    return access_token;
};

export const revokeServerRefreshToken = async (currentServer: ServerListItem): Promise<void> => {
    const { authConfig, refreshTokenKey } = createConfigAndRefreshTokenKey(currentServer);
    await revokeRefreshToken(refreshTokenKey, authConfig);
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
