import isElectron from 'is-electron';

export * from './components/settings';
export * from './hooks/use-default-settings';

const ipc = isElectron() ? window.electron.ipcRenderer : null;

const get = (property: string) => ipc?.SETTINGS_GET({ property });

const set = (property: string, value: any) => {
  ipc?.SETTINGS_SET({ property, value });
};

const restart = () => {
  ipc?.APP_RESTART();
};

export const localSettings = {
  get,
  restart,
  set,
};
