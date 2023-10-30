import { dirname, join } from 'path';
import { IpcRendererEvent, ipcRenderer, webFrame } from 'electron';
import Store from 'electron-store';

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

export const localSettings = {
    disableMediaKeys,
    enableMediaKeys,
    fontError,
    get,
    passwordGet,
    passwordRemove,
    passwordSet,
    path: join(dirname(store.path), 'cache'),
    restart,
    set,
    setZoomFactor,
};

export type LocalSettings = typeof localSettings;
