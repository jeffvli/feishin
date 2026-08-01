import { safeStorage } from 'electron';
import ElectronStore from 'electron-store';
import { discovery, None, refreshTokenGrant, tokenRevocation } from 'openid-client';

import log from '../../logger';
import { attachAccessTokenToAssetRequests } from './intercept_http_request';

import { OAuthAuthenticationConfig } from '/@/shared/types/domain-types';

const refreshTokenStore = new ElectronStore({
    name: 'refresh-tokens',
});

export const storeRefreshToken = async (key: string, refreshToken: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
        log.warn('Encryption not available. Cannot store refresh token securely.');
        return;
    }

    const encryptedToken = safeStorage.encryptString(refreshToken);
    refreshTokenStore.set(key, encryptedToken.toString('base64'));
};

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

        const response = await refreshTokenGrant(config, refreshToken);
        if (!response || !response.access_token) {
            return null;
        }
        attachAccessTokenToAssetRequests(audienceEndpoint, response.access_token);
        return response.access_token;
    } catch (error) {
        log.error('Failed to refresh access token: ', error);
        return null;
    }
};

export const getRefreshToken = async (key: string): Promise<null | string> => {
    try {
        const encryptedToken = refreshTokenStore.get(key);
        if (!encryptedToken) {
            log.warn(`No refresh token found for server.`);
            return null;
        }
        if (!safeStorage.isEncryptionAvailable()) {
            log.warn('Encryption not available. Cannot read refresh token securely.');
            return null;
        }
        return safeStorage.decryptString(Buffer.from(encryptedToken as string, 'base64'));
    } catch (error) {
        log.error('Failed to read refresh token:', error);
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
    await tokenRevocation(config, refreshToken, {
        token_type_hint: 'refresh_token',
    }).catch((error) => {
        log.error('Failed to revoke refresh token:', error);
    });
    refreshTokenStore.delete(key);
};
