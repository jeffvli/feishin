import { Client, SetActivity } from '@xhayper/discord-rpc';
import { ipcMain } from 'electron';

import log from '/@/main/logger';

const FEISHIN_DISCORD_APPLICATION_ID = '1165957668758900787';

let client: Client | null = null;

const createClient = async (clientId?: string) => {
    client = new Client({
        clientId: clientId || FEISHIN_DISCORD_APPLICATION_ID,
    });

    await client.login();

    return client;
};

const isConnected = () => {
    return client?.isConnected;
};

const setActivity = (activity: SetActivity) => {
    if (client) {
        void client.user?.setActivity({ ...activity }).catch((error) => {
            log.warn('Discord RPC set activity failed', error);
        });
    }
};

const clearActivity = () => {
    if (client) {
        void client.user?.clearActivity().catch((error) => {
            log.warn('Discord RPC clear activity failed', error);
        });
    }
};

const quit = () => {
    if (client) {
        void client.destroy().catch((error) => {
            log.error('Discord RPC destroy failed', error);
        });
    }
};

const VALID_JSON_PATH_REGEX = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/;

const isSafeJsonPath = (jsonPath: string) => VALID_JSON_PATH_REGEX.test(jsonPath);

const getJsonValueAtPath = (json: unknown, jsonPath: string) => {
    if (!isSafeJsonPath(jsonPath)) {
        return null;
    }

    let currentValue: unknown = json;

    for (const segment of jsonPath.split('.')) {
        if (typeof currentValue !== 'object' || currentValue === null) {
            return null;
        }

        currentValue = (currentValue as Record<string, unknown>)[segment];
    }

    return currentValue;
};

const postImageProxyRequest = async (
    imageProxyServerLink: string,
    fileFieldName: string,
    jsonPath: string,
    arrayBuffer: ArrayBuffer,
) => {
    const trimmedLink = imageProxyServerLink.trim();
    const trimmedFileFieldName = fileFieldName.trim();
    const trimmedJsonPath = jsonPath.trim();

    if (!trimmedLink || !trimmedFileFieldName || !trimmedJsonPath) {
        console.error(
            'Discord image proxy request failed: missing required settings:\n' +
                'fileFieldName: %s, jsonPath: %s, link: %s',
            trimmedFileFieldName,
            trimmedJsonPath,
            trimmedLink,
        );
        return null;
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(trimmedLink);
    } catch {
        console.error(
            'Discord image proxy request failed: invalid image proxy URL:\nlink %s',
            trimmedLink,
        );
        return null;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        console.error(
            'Discord image proxy request failed: invalid image proxy URL:\nlink %s',
            trimmedLink,
        );
        return null;
    }

    if (!isSafeJsonPath(trimmedJsonPath)) {
        console.error(
            'Discord image proxy request failed: invalid JSON path:\njsonPath: %s',
            trimmedJsonPath,
        );
        return null;
    }

    const formData = new FormData();
    formData.append(trimmedFileFieldName, new Blob([Buffer.from(arrayBuffer)]), 'cover-art');

    const fileUploadResponse = await fetch(parsedUrl.toString(), {
        body: formData,
        method: 'POST',
    });

    if (!fileUploadResponse.ok) {
        console.error(
            'Discord image proxy request failed: upload request returned an unsuccessful response:\nresponse status: %s',
            fileUploadResponse.status,
        );
        return null;
    }

    const json = await fileUploadResponse.json();
    const responseValue = getJsonValueAtPath(json, trimmedJsonPath);

    return typeof responseValue === 'string' && responseValue.length > 0 ? responseValue : null;
};

ipcMain.handle('discord-rpc-initialize', async (_event, clientId?: string) => {
    try {
        await createClient(clientId);
        log.info('Discord RPC initialized');
    } catch (error) {
        log.error('Discord RPC initialize failed', error);
        throw error;
    }
});

ipcMain.handle('discord-rpc-is-connected', () => {
    return isConnected();
});

ipcMain.handle(
    'discord-rpc-post-image-proxy-request',
    (_event, imageProxyServerLink, fileFieldName, jsonPath, arrayBuffer) => {
        return postImageProxyRequest(imageProxyServerLink, fileFieldName, jsonPath, arrayBuffer);
    },
);

ipcMain.handle('discord-rpc-set-activity', (_event, activity: SetActivity) => {
    setActivity(activity);
});

ipcMain.handle('discord-rpc-clear-activity', () => {
    clearActivity();
});

ipcMain.handle('discord-rpc-quit', () => {
    quit();
    client = null;
    log.info('Discord RPC quit');
});

export const discordRpc = {
    clearActivity,
    createClient,
    isConnected,
    postImageProxyRequest,
    quit,
    setActivity,
};
