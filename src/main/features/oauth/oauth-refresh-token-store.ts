import { safeStorage } from 'electron';
import { OidcClient, OidcClientSettings } from 'oidc-client-ts';

import log from '../../logger';
import { attachAccessTokenToAssetRequests } from './intercept_http_request';

import { store } from '/@/main/features/core/settings';

export const storeRefreshToken = async (key: string, refreshToken: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
        log.warn('Encryption not available. Cannot store refresh token securely.');
        return;
    }

    const encryptedToken = safeStorage.encryptString(refreshToken);
    store.set(key, encryptedToken.toString('base64'));
};

export const refreshAccessToken = async (
    refreshTokenKey: string,
    clientSettings: OidcClientSettings,
    audienceEndpoint: string,
): Promise<null | string> => {
    try {
        const client = new OidcClient(clientSettings);
        const refreshToken = await getRefreshToken(refreshTokenKey);

        if (!refreshToken) {
            log.warn(`No refresh token found for server ${refreshTokenKey}.`);
            return null;
        }
        const tokenResponse = await client.useRefreshToken({
            state: {
                // Dummy values required but aren't used to refresh the access token
                profile: {
                    aud: '',
                    exp: 0,
                    iat: 0,
                    iss: '',
                    sub: 'user-sub',
                },
                refresh_token: refreshToken,
                session_state: null,
            },
        });
        if (!tokenResponse || !tokenResponse.access_token) {
            return null;
        }
        attachAccessTokenToAssetRequests(audienceEndpoint, tokenResponse.access_token);
        return tokenResponse.access_token;
    } catch (error) {
        log.error('Failed to refresh access token: ', error);
        return null;
    }
};

export const getRefreshToken = async (key: string): Promise<null | string> => {
    try {
        const encryptedToken = store.get(key);
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

export const revokeRefreshToken = async (key: string, clientSettings: OidcClientSettings) => {
    const client = new OidcClient(clientSettings);
    const refreshToken = await getRefreshToken(key);
    if (!refreshToken) {
        log.warn(`No refresh token to revoke.`);
        return;
    }
    await client.revokeToken(refreshToken, 'refresh_token').catch((error) => {
        log.error('Failed to revoke refresh token:', error);
    });
    store.delete(key);
};
