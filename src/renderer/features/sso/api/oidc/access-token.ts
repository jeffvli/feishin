import { discovery, None, refreshTokenGrant, tokenRevocation } from 'openid-client';

import {
    attachAccessTokenToRequests,
    deleteRefreshToken,
    getRefreshToken,
    storeRefreshToken,
} from '/@/renderer/features/sso/api/oidc/oidc-api';
import { logger } from '/@/renderer/utils/logger';
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
            logger.warn(`No refresh token found for server ${refreshTokenKey}.`);
            return null;
        }

        // Refresh the access token using the refresh token
        const response = await refreshTokenGrant(config, refreshToken);
        if (!response || !response.access_token) {
            return null;
        }
        attachAccessTokenToRequests(audienceEndpoint, response.access_token);

        // An OIDC provider may make one-time refresh tokens and send a new one when refreshing access token
        if (response.refresh_token) {
            logger.info('New refresh token received. Storing the new refresh token.');
            await storeRefreshToken(refreshTokenKey, response.refresh_token);
        }
        return response.access_token;
    } catch (error) {
        logger.error('Failed to refresh access token: ', error);
        return null;
    }
};

export const revokeRefreshToken = async (key: string, authConfig: OAuthAuthenticationConfig) => {
    const config = await discovery(
        new URL(authConfig.issuerUrl),
        authConfig.clientId,
        undefined,
        None(),
    );
    const refreshToken = await getRefreshToken(key);
    if (!refreshToken) {
        logger.warn(`No refresh token to revoke.`);
        return;
    }
    await deleteRefreshToken(key);
    await tokenRevocation(config, refreshToken, {
        token_type_hint: 'refresh_token',
    }).catch((error) => {
        logger.error('Failed to revoke refresh token:', error);
    });
};
