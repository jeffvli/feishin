import { ipcMain } from 'electron';
import settings from 'electron-settings';

ipcMain.on('settings-get', async (__event, data: { property: string }) => {
  return settings.getSync(data.property);
});

ipcMain.on(
  'settings-set',
  async (__event, data: { property: string; value: any }) => {
    return settings.setSync(data.property, data.value);
  }
);
