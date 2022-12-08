import Store from 'electron-store';
import { app, ipcRenderer } from 'electron';

const store = new Store();

const set = (property: string, value: string | Record<string, unknown> | boolean) => {
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
  set,
  get,
  enableMediaKeys,
  disableMediaKeys,
  restart,
};
