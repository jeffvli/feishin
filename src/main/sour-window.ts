import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';

import { keepIcon } from './sour-icon';

// Sour Player's mini player: shrinks the window to a small card that stays on top (where you last left
// it), then puts the window back the way it was (size, maximised, full screen).
interface Saved {
    bounds: Electron.Rectangle;
    fullScreen: boolean;
    maximized: boolean;
    minimum: number[];
    onTop: boolean;
}
let saved: null | Saved = null;
let miniBounds: Electron.Rectangle | null = null;
let closing = false;
const watched = new WeakSet<BrowserWindow>();

// the mini card's size: where you last left it (if it was sensibly small), else 400 x 160
const MINI = { height: 160, width: 400 };
const miniSize = () =>
    miniBounds && miniBounds.width <= 700 && miniBounds.height <= 320 ? miniBounds : null;

const applyMini = (win: BrowserWindow) => {
    if (!saved || win.isDestroyed()) return;
    if (win.isMaximized() || win.isFullScreen()) return;
    const remembered = miniSize();
    if (remembered) win.setBounds(remembered);
    else win.setSize(MINI.width, MINI.height);
};

const keepOnTop = (win: BrowserWindow) => {
    if (win.isDestroyed()) return;
    if (process.platform === 'linux') {
        // X11 ignores the "floating" level; plain always-on-top plus "on every workspace" is what
        // most Linux desktops honour
        win.setAlwaysOnTop(true);
        win.setVisibleOnAllWorkspaces(true);
        win.moveTop();
    } else {
        win.setAlwaysOnTop(true, 'floating');
    }
};

const shrink = (win: BrowserWindow) => {
    saved = {
        bounds: win.getNormalBounds(),
        fullScreen: win.isFullScreen(),
        maximized: win.isMaximized(),
        minimum: win.getMinimumSize(),
        onTop: win.isAlwaysOnTop(),
    };
    win.setMinimumSize(300, 120);
    win.setResizable(true);
    // Linux window managers leave full screen / maximised a moment later and then put the old size
    // back, which used to leave a huge "mini" player: size it again once they're done
    if (win.isFullScreen()) {
        win.once('leave-full-screen', () => applyMini(win));
        win.setFullScreen(false);
    }
    if (win.isMaximized()) {
        win.once('unmaximize', () => applyMini(win));
        win.unmaximize();
    }
    applyMini(win);
    for (const wait of [150, 500, 1200]) {
        setTimeout(() => {
            const b = !win.isDestroyed() && win.getBounds();
            if (b && (b.width > 720 || b.height > 340)) applyMini(win);
        }, wait);
    }
    keepOnTop(win);
    // some Linux window managers drop "on top" when the window changes size or loses focus
    for (const wait of [200, 800]) setTimeout(() => saved && keepOnTop(win), wait);
};

const restore = (win: BrowserWindow) => {
    if (!saved) return;
    const { bounds, fullScreen, maximized, minimum, onTop } = saved;
    saved = null;
    win.setAlwaysOnTop(onTop);
    if (process.platform === 'linux') win.setVisibleOnAllWorkspaces(false);
    win.setMinimumSize(minimum[0], minimum[1]);
    win.setBounds(bounds);
    if (maximized) win.maximize();
    if (fullScreen) win.setFullScreen(true);
};

ipcMain.on('sour-mini', (event, on: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (on && !saved) {
        shrink(win);
        if (!watched.has(win)) {
            watched.add(win);
            // losing focus (clicking another window or tab) must not send the mini player behind
            win.on('blur', () => {
                if (saved && process.platform === 'linux') keepOnTop(win);
            });
            // closing the app while it's small: put the full window back first, so the size the app
            // remembers for next time is the full one (this runs before the app saves it)
            win.prependListener('close', () => {
                closing = !!saved;
                restore(win);
            });
            // ...and when closing only hides it to the tray, it comes back as the mini player
            win.on('close', (closeEvent) => {
                if (!closing) return;
                closing = false;
                if (closeEvent.defaultPrevented && !win.isDestroyed()) shrink(win);
            });
        }
    } else if (!on && saved) {
        const b = win.getBounds();
        if (b.width <= 700 && b.height <= 320) miniBounds = b;
        restore(win);
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
    keepIcon(image);
});
