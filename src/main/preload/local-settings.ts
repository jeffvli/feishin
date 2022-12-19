import { app, ipcRenderer } from 'electron';
import Store from 'electron-store';

const store = new Store();

const set = (property: string, value: string | Record<string, unknown> | boolean | string[]) => {
  store.set(`${property}`, value);
};

const get = (property: string) => {
  return store.get(`${property}`);
};

const restart = () => {
  app.relaunch();
  app.exit(0);
};

const enableMediaKeys = () => {
  ipcRenderer.send('global-media-keys-enable');
};

const disableMediaKeys = () => {
  ipcRenderer.send('global-media-keys-disable');
};

export const localSettings = {
  disableMediaKeys,
  enableMediaKeys,
  get,
  restart,
  set,
};
