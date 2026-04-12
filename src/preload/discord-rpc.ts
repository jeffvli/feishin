import type { SetActivity } from '@xhayper/discord-rpc';

import { ipcRenderer } from 'electron';

const initialize = (clientId: string) => {
    const client = ipcRenderer.invoke('discord-rpc-initialize', clientId);
    return client;
};

const isConnected = () => {
    const isConnected = ipcRenderer.invoke('discord-rpc-is-connected');
    return isConnected;
};

const clearActivity = () => {
    ipcRenderer.invoke('discord-rpc-clear-activity');
};

const setActivity = (activity: SetActivity) => {
    ipcRenderer.invoke('discord-rpc-set-activity', activity);
};

const quit = () => {
    ipcRenderer.invoke('discord-rpc-quit');
};

export const discordRpc = {
    clearActivity,
    initialize,
    isConnected,
    quit,
    setActivity,
};

export type DiscordRpc = typeof discordRpc;
