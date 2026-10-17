import { app, NativeImage, shell } from 'electron';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Icon packs beyond the open window: the window icon only lasts while the app runs, so the chosen
// icon is also put where the system looks for it - the Windows shortcuts (desktop, Start menu and
// taskbar pins) and the Linux launcher icon. macOS only allows changing the Dock icon while running.

// a .ico file holding one PNG (Windows Vista and later read these)
const toIco = (png: Buffer) => {
    const header = Buffer.alloc(22);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header.writeUInt8(0, 6); // 0 means 256 wide
    header.writeUInt8(0, 7);
    header.writeUInt8(0, 8);
    header.writeUInt8(0, 9);
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);
    return Buffer.concat([header, png]);
};

const shortcutFolders = () => {
    const roaming = app.getPath('appData');
    return [
        app.getPath('desktop'),
        path.join(roaming, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        path.join(
            roaming,
            'Microsoft',
            'Internet Explorer',
            'Quick Launch',
            'User Pinned',
            'TaskBar',
        ),
        path.join(roaming, 'Microsoft', 'Internet Explorer', 'Quick Launch'),
    ];
};

const updateWindowsShortcuts = (iconPath: string) => {
    const exe = process.execPath.toLowerCase();
    for (const folder of shortcutFolders()) {
        let names: string[] = [];
        try {
            names = fs.readdirSync(folder);
        } catch {
            continue;
        }
        for (const name of names) {
            if (!name.toLowerCase().endsWith('.lnk')) continue;
            const file = path.join(folder, name);
            try {
                const link = shell.readShortcutLink(file);
                if (link.target.toLowerCase() !== exe) continue;
                if (link.icon?.toLowerCase() === iconPath.toLowerCase()) continue;
                shell.writeShortcutLink(file, 'update', { ...link, icon: iconPath, iconIndex: 0 });
            } catch {
                // not a shortcut we can read or change
            }
        }
    }
};

// remembers which icon was last put in place, so a restart doesn't rewrite the shortcuts again
const stampFile = () => path.join(app.getPath('userData'), 'icon-stamp.txt');

export const keepIcon = (image: NativeImage) => {
    const png = image.resize({ height: 256, width: 256 }).toPNG();
    const id = createHash('sha1').update(new Uint8Array(png)).digest('hex');
    try {
        if (fs.readFileSync(stampFile(), 'utf8') === id) return;
    } catch {
        // first time
    }
    try {
        fs.writeFileSync(stampFile(), id);
        if (process.platform === 'win32') {
            const dir = path.join(app.getPath('userData'), 'icon');
            fs.mkdirSync(dir, { recursive: true });
            // a new file name each time, so Explorer's icon cache shows the change straight away
            for (const old of fs.readdirSync(dir)) fs.rmSync(path.join(dir, old), { force: true });
            const icoPath = path.join(dir, `sour-player-${Date.now()}.ico`);
            fs.writeFileSync(icoPath, toIco(png));
            updateWindowsShortcuts(icoPath);
        } else if (process.platform === 'linux') {
            const dataHome =
                process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
            const hicolor = path.join(dataHome, 'icons', 'hicolor');
            for (const size of ['256x256', '512x512']) {
                const dir = path.join(hicolor, size, 'apps');
                fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(path.join(dir, 'sour-player.png'), png);
            }
            // tells the desktop the icon theme changed
            const now = new Date();
            fs.utimesSync(hicolor, now, now);
        }
    } catch {
        // the window icon still changed; the rest is a nice extra
    }
};
