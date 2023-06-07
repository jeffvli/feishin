import Store from 'electron-store';
import { ipcRenderer } from 'electron';

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

const passwordClear = () => {
  ipcRenderer.send('password-clear');
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

export const localSettings = {
  disableMediaKeys,
  enableMediaKeys,
  get,
  passwordClear,
  passwordGet,
  passwordRemove,
  passwordSet,
  restart,
  set,
};
