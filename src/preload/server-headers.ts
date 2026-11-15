import type { ServerHeaderRule } from '/@/shared/utils/server-headers';

import { ipcRenderer } from 'electron';

export type { ServerHeaderRule };

const sync = (rules: ServerHeaderRule[]): Promise<void> => {
    return ipcRenderer.invoke('server-headers-sync', rules);
};

const setPending = (rules: ServerHeaderRule[]): Promise<void> => {
    return ipcRenderer.invoke('server-headers-set-pending', rules);
};

const clearCookies = (serverUrl: string): Promise<boolean> => {
    return ipcRenderer.invoke('session-clear-server-cookies', serverUrl);
};

export const serverHeaders = {
    clearCookies,
    setPending,
    sync,
};

export type ServerHeaders = typeof serverHeaders;
