import { app } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Linux AppImage: pinning the running app to the taskbar used to pin the AppImage's temporary mount
// (/tmp/.mount_.../sour-player), which is gone once the app closes ("does not exist"). A launcher
// (.desktop file) pointing at the AppImage itself, with the same window class as the app, makes the
// taskbar pin that instead. Written on every start, so it follows the AppImage if it moves.

// a path as one argument of a desktop file's Exec line
const execArg = (value: string) => `"${value.replace(/(["`$\\])/g, '\\$1')}"`;

const integrateAppImage = () => {
    const appImage = process.env.APPIMAGE;
    if (process.platform !== 'linux' || !appImage) return;
    try {
        const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
        const apps = path.join(dataHome, 'applications');
        const icons = path.join(dataHome, 'icons', 'hicolor', '512x512', 'apps');
        fs.mkdirSync(apps, { recursive: true });
        fs.mkdirSync(icons, { recursive: true });
        const iconSource = path.join(process.resourcesPath, 'assets', 'icons', '512x512.png');
        // only the first time: after that it may be an icon pack the user picked (sour-icon.ts)
        const iconFile = path.join(icons, 'sour-player.png');
        if (fs.existsSync(iconSource) && !fs.existsSync(iconFile)) {
            fs.copyFileSync(iconSource, iconFile);
        }
        const entry = [
            '[Desktop Entry]',
            'Type=Application',
            'Name=Sour Player',
            'Comment=The music player for Hermes Music',
            `Exec=${execArg(appImage)} %U`,
            'Icon=sour-player',
            'Terminal=false',
            'Categories=AudioVideo;Audio;Player;',
            'StartupWMClass=sour-player',
            '',
        ].join('\n');
        const file = path.join(apps, 'sour-player.desktop');
        if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== entry) {
            fs.writeFileSync(file, entry);
        }
    } catch {
        // a missing launcher only matters for pinning; never stop the app over it
    }
};

app.whenReady().then(integrateAppImage);

// Linux: on Wayland desktops apps aren't allowed to keep a window above the others, so the mini player
// fell behind other windows. Running through XWayland lets it stay on top (and taskbars match the
// window to its launcher more reliably). SOUR_WAYLAND=1 keeps native Wayland for anyone who prefers it.
if (
    process.platform === 'linux' &&
    !process.env.SOUR_WAYLAND &&
    !app.commandLine.hasSwitch('ozone-platform')
) {
    app.commandLine.appendSwitch('ozone-platform', 'x11');
}
