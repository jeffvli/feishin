import { safeStorage } from 'electron';
import ElectronStore from 'electron-store';

import log from '../../../logger';

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

export const deleteRefreshToken = async (key: string) => {
    refreshTokenStore.delete(key);
};
