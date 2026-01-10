import { ipcRenderer, IpcRendererEvent, OpenDialogOptions, webFrame } from 'electron';
import Store from 'electron-store';

import { TitleTheme } from '/@/shared/types/types';

const store = new Store();

const set = (
    property: string,
    value: boolean | Record<string, unknown> | string | string[] | undefined,
) => {
    if (value === undefined) {
        store.delete(property);
        return;
    }

    store.set(`${property}`, value);
};

const get = (property: string) => {
    return store.get(`${property}`);
};

const restart = () => {
    ipcRenderer.send('app-restart');
};

const enableMediaKeys = () => {
    ipcRenderer.send('global-media-keys-enable');
};

const disableMediaKeys = () => {
    ipcRenderer.send('global-media-keys-disable');
};

const passwordGet = async (server: string): Promise<null | string> => {
    return ipcRenderer.invoke('password-get', server);
};

const passwordRemove = (server: string) => {
    ipcRenderer.send('password-remove', server);
};

const passwordSet = async (password: string, server: string): Promise<boolean> => {
    return ipcRenderer.invoke('password-set', password, server);
};

const setZoomFactor = (zoomFactor: number) => {
    webFrame.setZoomFactor(zoomFactor / 100);
};

const fontError = (cb: (event: IpcRendererEvent, file: string) => void) => {
    ipcRenderer.on('custom-font-error', cb);
};

const themeSet = (theme: TitleTheme): void => {
    ipcRenderer.send('theme-set', theme);
};

const openFileSelector = async (options?: OpenDialogOptions) => {
    const result = await ipcRenderer.invoke('open-file-selector', options);
    return result;
};

export const toServerType = (value?: string): null | string => {
    switch (value?.toLowerCase()) {
        case 'jellyfin':
            return 'jellyfin';
        case 'navidrome':
            return 'navidrome';
        case 'subsonic':
            return 'subsonic';
        default:
            return null;
    }
};

const SERVER_TYPE = toServerType(process.env.SERVER_TYPE);

const env = {
    LEGACY_AUTHENTICATION:
        SERVER_TYPE !== null
            ? process.env.LEGACY_AUTHENTICATION?.toLocaleLowerCase() === 'true'
            : false,
    SERVER_LOCK:
        SERVER_TYPE !== null ? process.env.SERVER_LOCK?.toLocaleLowerCase() === 'true' : false,
    SERVER_NAME: process.env.SERVER_NAME ?? '',
    SERVER_TYPE,
    SERVER_URL: process.env.SERVER_URL ?? 'http://',
    START_MAXIMIZED: store.get('maximized'),
};

export const localSettings = {
    disableMediaKeys,
    enableMediaKeys,
    env,
    fontError,
    get,
    openFileSelector,
    passwordGet,
    passwordRemove,
    passwordSet,
    restart,
    set,
    setZoomFactor,
    themeSet,
};

export type LocalSettings = typeof localSettings;
