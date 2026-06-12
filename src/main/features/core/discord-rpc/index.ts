import { Client, SetActivity } from '@xhayper/discord-rpc';
import { ipcMain } from 'electron';

import log from '/@/main/logger';
import { toast } from '/@/shared/components/toast/toast';

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

const postImageProxyRequest = async (imageProxyServerLink: string, arrayBuffer: ArrayBuffer) => {
    const buffer = Buffer.from(arrayBuffer);

    const formData = new FormData();
    formData.append('files[]', new Blob([buffer]));

    const fileUploadResponse = await fetch(imageProxyServerLink, {
        body: formData,
        method: 'POST',
    });

    if (!fileUploadResponse.ok) {
        toast.error({
            message: 'Cover art image could not be uploaded to specified image proxy server',
        });
        throw new Error();
    }

    const json = await fileUploadResponse.json();

    // Location within json for uguu.se
    return json.files[0].url;
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

ipcMain.handle('discord-rpc-post-image-proxy-request', (_event, imageProxyServerLink, formData) => {
    return postImageProxyRequest(imageProxyServerLink, formData);
});

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
