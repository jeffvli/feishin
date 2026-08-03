import { discovery, None, refreshTokenGrant, tokenRevocation } from 'openid-client';

import { attachAccessTokenToAssetRequests } from './intercept_http_request';
import { deleteRefreshToken, getRefreshToken, storeRefreshToken } from './refresh-token-store';

import log from '/@/main/logger';
import { OAuthAuthenticationConfig } from '/@/shared/types/domain-types';

export const refreshAccessToken = async (
    refreshTokenKey: string,
    authConfig: OAuthAuthenticationConfig,
    audienceEndpoint: string,
): Promise<null | string> => {
    try {
        const config = await discovery(
            new URL(authConfig.issuerUrl),
            authConfig.clientId,
            undefined,
            None(),
        );
        const refreshToken = await getRefreshToken(refreshTokenKey);

        if (!refreshToken) {
            log.warn(`No refresh token found for server ${refreshTokenKey}.`);
            return null;
        }

        // Refresh the access token using the refresh token
        const response = await refreshTokenGrant(config, refreshToken);
        if (!response || !response.access_token) {
            return null;
        }
        attachAccessTokenToAssetRequests(audienceEndpoint, response.access_token);

        // An OIDC provider may make one-time refresh tokens and send a new one when refreshing access token
        if (response.refresh_token) {
            log.info('New refresh token received. Storing the new refresh token.');
            await storeRefreshToken(refreshTokenKey, response.refresh_token);
        }
        return response.access_token;
    } catch (error) {
        log.error('Failed to refresh access token: ', error);
        return null;
    }
};

export const revokeRefreshToken = async (key: string, authConfig: OAuthAuthenticationConfig) => {
    const config = await discovery(
        new URL(authConfig.issuerUrl),
        authConfig.clientId,
        undefined,
        None,
    );
    const refreshToken = await getRefreshToken(key);
    if (!refreshToken) {
        log.warn(`No refresh token to revoke.`);
        return;
    }
    await deleteRefreshToken(key);
    await tokenRevocation(config, refreshToken, {
        token_type_hint: 'refresh_token',
    }).catch((error) => {
        log.error('Failed to revoke refresh token:', error);
    });
};
