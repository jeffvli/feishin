import { BrowserWindow, ipcMain } from 'electron';

// Sour Player's mini player: shrinks the window to just the player bar and keeps it on top, then
// puts it back the way it was.
let saved: null | { bounds: Electron.Rectangle; minimum: number[]; onTop: boolean } = null;

ipcMain.on('sour-mini', (event, on: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (on && !saved) {
        saved = { bounds: win.getBounds(), minimum: win.getMinimumSize(), onTop: win.isAlwaysOnTop() };
        if (win.isMaximized()) win.unmaximize();
        win.setMinimumSize(360, 100);
        win.setSize(520, 140);
        win.setAlwaysOnTop(true);
    } else if (!on && saved) {
        win.setAlwaysOnTop(saved.onTop);
        win.setMinimumSize(saved.minimum[0], saved.minimum[1]);
        win.setBounds(saved.bounds);
        saved = null;
    }
});
