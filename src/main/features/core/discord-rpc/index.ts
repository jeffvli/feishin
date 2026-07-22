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
