import { ipcMain } from 'electron';
import Store from 'electron-store';

export const store = new Store();

ipcMain.handle('settings-get', (_event, data: { property: string }) => {
  return store.get(`${data.property}`);
});

ipcMain.on('settings-set', (__event, data: { property: string; value: any }) => {
  store.set(`${data.property}`, data.value);
});
