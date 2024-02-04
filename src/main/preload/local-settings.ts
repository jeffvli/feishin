import { IpcRendererEvent, ipcRenderer, webFrame } from 'electron';
import Store from 'electron-store';
import { toServerType, type TitleTheme, ServerType } from '/@/renderer/types';

const store = new Store();

const set = (property: string, value: string | Record<string, unknown> | boolean | string[]) => {
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

const passwordGet = async (server: string): Promise<string | null> => {
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

const SERVER_TYPE = toServerType(process.env.SERVER_TYPE);

const env = {
    SERVER_LOCK:
        SERVER_TYPE !== null
            ? process.env.SERVER_LOCK?.toLocaleLowerCase() === 'true'
            : ServerType.JELLYFIN,
    SERVER_NAME: process.env.SERVER_NAME ?? '',
    SERVER_TYPE,
    SERVER_URL: process.env.SERVER_URL ?? 'http://',
};

export const localSettings = {
    disableMediaKeys,
    enableMediaKeys,
    env,
    fontError,
    get,
    passwordGet,
    passwordRemove,
    passwordSet,
    restart,
    set,
    setZoomFactor,
    themeSet,
};

export type LocalSettings = typeof localSettings;
