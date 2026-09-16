import { ipcRenderer } from 'electron';

export type ServerHeaderRule = {
    baseUrl: string;
    headers: Record<string, string>;
};

const sync = (rules: ServerHeaderRule[]): Promise<void> => {
    return ipcRenderer.invoke('server-headers-sync', rules);
};

export const serverHeaders = {
    sync,
};

export type ServerHeaders = typeof serverHeaders;
