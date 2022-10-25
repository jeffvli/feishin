import isElectron from 'is-electron';

export * from './hooks/useDefaultSettings';

const ipc = isElectron() ? window.electron.ipcRenderer : null;

const get = (property: string) => ipc?.SETTINGS_GET({ property });

const set = (property: string, value: any) => {
  ipc?.SETTINGS_SET({ property, value });
};

export const settings = {
  get,
  set,
};
