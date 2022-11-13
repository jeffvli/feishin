import isElectron from 'is-electron';

const ipc = isElectron() ? window.electron.ipcRenderer : null;

export const getLocalSetting = (property: string) =>
  ipc?.SETTINGS_GET({ property });

export const setLocalSetting = (property: string, value: any) => {
  ipc?.SETTINGS_SET({ property, value });
};

export const restartApp = () => {
  ipc?.APP_RESTART();
};

export const localSettings = {
  get: getLocalSetting,
  restart: restartApp,
  set: setLocalSetting,
};
