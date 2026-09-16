import { ipcRenderer } from 'electron';

export type ServerHeaderRule = {
    baseUrl: string;
    headers: Record<string, string>;
};

const sync = (rules: ServerHeaderRule[]): Promise<void> => {
    return ipcRenderer.invoke('server-headers-sync', rules);
};

const clearCookies = (serverUrl: string): Promise<boolean> => {
    return ipcRenderer.invoke('session-clear-server-cookies', serverUrl);
};

export const serverHeaders = {
    clearCookies,
    sync,
};

export type ServerHeaders = typeof serverHeaders;
