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

type ImageProxyConfig = LitterboxConfig | UguuConfig;

interface ImageProxyHandler<TConfig extends ImageProxyConfig> {
    upload(url: URL, config: TConfig, arrayBuffer: ArrayBuffer): Promise<null | string>;
}

interface LitterboxConfig {
    time: '1h' | '12h' | '24h' | '72h';
}

interface UguuConfig {}

const VALID_JSON_PATH_REGEX = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/;

const isSafeJsonPath = (jsonPath: string) => VALID_JSON_PATH_REGEX.test(jsonPath);

const validateHttpUrl = (link: string): null | URL => {
    const trimmedLink = link.trim();

    if (!trimmedLink) {
        console.error('Image proxy request failed: missing URL');
        return null;
    }

    let url: URL;

    try {
        url = new URL(trimmedLink);
    } catch {
        console.error('Image proxy request failed: invalid URL:', trimmedLink);
        return null;
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
        console.error('Image proxy request failed: invalid protocol:', url.protocol);
        return null;
    }

    return url;
};

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

const extractStringFromJson = (json: unknown, jsonPath: string): null | string => {
    const value = getJsonValueAtPath(json, jsonPath);

    return typeof value === 'string' && value.length > 0 ? value : null;
};

const createFileFormData = (fieldName: string, arrayBuffer: ArrayBuffer): FormData => {
    const formData = new FormData();

    formData.append(fieldName, new Blob([Buffer.from(arrayBuffer)]), 'cover-art');

    return formData;
};

const postMultipartRequest = async (url: URL, formData: FormData): Promise<null | Response> => {
    const response = await fetch(url, {
        body: formData,
        method: 'POST',
    });

    if (!response.ok) {
        console.error('Image proxy upload failed:', response.status);
        return null;
    }

    return response;
};

class LitterboxUploader implements ImageProxyHandler<LitterboxConfig> {
    async upload(
        url: URL,
        config: LitterboxConfig,
        arrayBuffer: ArrayBuffer,
    ): Promise<null | string> {
        const formData = createFileFormData('fileToUpload', arrayBuffer);

        // Litterbox requires additional fields
        formData.append('reqtype', 'fileupload');
        formData.append('time', config.time);

        const response = await postMultipartRequest(url, formData);

        if (!response) {
            return null;
        }

        const uploadedUrl = (await response.text()).trim();

        return uploadedUrl.startsWith('https://') ? uploadedUrl : null;
    }
}

class UguuUploader implements ImageProxyHandler<UguuConfig> {
    async upload(url: URL, _config: UguuConfig, arrayBuffer: ArrayBuffer): Promise<null | string> {
        const formData = createFileFormData('files[]', arrayBuffer);

        const response = await postMultipartRequest(url, formData);

        if (!response) {
            return null;
        }

        const json = await response.json();

        return extractStringFromJson(json, 'files.0.url');
    }
}

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
    (_event, imageProxyServerLink, servertype, arrayBuffer) => {
        if (!imageProxyServerLink || !arrayBuffer) {
            console.error('Image proxy request failed: missing parameters');
            return null;
        }
        const url = validateHttpUrl(imageProxyServerLink);
        if (!url) {
            return null;
        }
        switch (servertype) {
            // TODO: pass config instead of defining here, should be user-defined
            case 'litterbox': {
                const config: LitterboxConfig = {
                    time: '1h',
                };
                const uploader = new LitterboxUploader();
                return uploader.upload(url, config, arrayBuffer);
            }
            case 'uguu': {
                const uploader = new UguuUploader();
                return uploader.upload(url, {}, arrayBuffer);
            }
            default:
                console.error('Image proxy request failed: unknown server type', servertype);
                return null;
        }
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
    quit,
    setActivity,
};
