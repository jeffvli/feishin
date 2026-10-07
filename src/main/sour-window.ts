import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';

// Sour Player's mini player: shrinks the window to a small card that stays on top (where you last left
// it), then puts the window back the way it was.
let saved: null | { bounds: Electron.Rectangle; minimum: number[]; onTop: boolean } = null;
let miniBounds: Electron.Rectangle | null = null;
const watched = new WeakSet<BrowserWindow>();

ipcMain.on('sour-mini', (event, on: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (on && !saved) {
        saved = {
            bounds: win.getBounds(),
            minimum: win.getMinimumSize(),
            onTop: win.isAlwaysOnTop(),
        };
        if (win.isFullScreen()) win.setFullScreen(false);
        if (win.isMaximized()) win.unmaximize();
        win.setMinimumSize(300, 120);
        if (miniBounds) win.setBounds(miniBounds);
        else win.setSize(400, 160);
        win.setAlwaysOnTop(true, 'floating');
        // closing the app while it's small: remember the full window size, not the mini one
        if (!watched.has(win)) {
            watched.add(win);
            win.on('close', () => {
                if (!saved) return;
                win.setAlwaysOnTop(saved.onTop);
                win.setMinimumSize(saved.minimum[0], saved.minimum[1]);
                win.setBounds(saved.bounds);
                saved = null;
            });
        }
    } else if (!on && saved) {
        miniBounds = win.getBounds();
        win.setAlwaysOnTop(saved.onTop);
        win.setMinimumSize(saved.minimum[0], saved.minimum[1]);
        win.setBounds(saved.bounds);
        saved = null;
    }
});

// Sour Player icon packs and holiday icons: the app draws the icon and the window shows it
ipcMain.on('sour-icon', (event, data: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || typeof data !== 'string' || !data.startsWith('data:image/png;base64,')) return;
    if (data.length > 2_000_000) return;
    const image = nativeImage.createFromDataURL(data);
    if (image.isEmpty()) return;
    win.setIcon(image);
    if (process.platform === 'darwin') app.dock?.setIcon(image);
});
