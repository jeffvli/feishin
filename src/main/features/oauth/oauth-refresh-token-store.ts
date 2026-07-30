import { app, safeStorage } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

import log from '../../logger';

export const TOKEN_DIRNAME = 'Tokens';
const tokenPath = (serverId: string) =>
    path.join(app.getPath('userData'), TOKEN_DIRNAME, `refresh_token_${serverId}.enc`);

export const storeRefreshToken = async (serverId: string, refreshToken: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
        log.warn('Encryption not available. Cannot store refresh token securely.');
        return;
    }

    const encryptedToken = safeStorage.encryptString(refreshToken);
    try {
        await fs.mkdir(path.dirname(tokenPath(serverId)), { recursive: true });
        await fs.writeFile(tokenPath(serverId), encryptedToken, { mode: 0o600 });
    } catch (error) {
        log.error('Failed to store refresh token:', error);
    }
};

export const getRefreshToken = async (serverId: string): Promise<null | string> => {
    try {
        const encryptedToken = await fs.readFile(tokenPath(serverId));
        return safeStorage.decryptString(encryptedToken);
    } catch (error) {
        log.error('Failed to read refresh token:', error);
        return null;
    }
};

export const deleteRefreshToken = async (serverId: string) => {
    try {
        await fs.unlink(tokenPath(serverId));
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
            log.warn(`Refresh token for server ${serverId} does not exist.`);
        } else {
            log.error('Failed to delete refresh token:', error);
        }
    }
};
