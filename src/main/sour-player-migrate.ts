import { app } from 'electron';
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import path from 'path';

// Sour Player keeps its own settings folder, so it never mixes with (or gets replaced by) the official
// Feishin. The first time it starts, it copies the settings, servers and theme from the Hermes Music
// edition of Feishin. Settings from the official Feishin are left alone: they can come from a newer or
// older Feishin whose saved settings Sour Player can't read (that crashed it on start).
// Imported before anything else reads the settings folder.
const target = app.getPath('userData');
const source = path.join(app.getPath('appData'), 'feishin');

// the Hermes edition saved these keys in its local storage
const isHermesEdition = (dir: string) => {
    const store = path.join(dir, 'Local Storage', 'leveldb');
    try {
        return readdirSync(store).some((file) => {
            if (!/\.(ldb|log)$/.test(file)) return false;
            const data = readFileSync(path.join(store, file));
            return data.includes('hermes-video') || data.includes('group-play');
        });
    } catch {
        return false;
    }
};

// One-time repair for Sour Player 0.1.x, which copied the official Feishin's settings too: if that's
// what this install has, move those settings aside (renamed, not deleted) so Sour Player starts fresh.
const checked = path.join(target, '.sour-settings-checked');
if (existsSync(target) && !existsSync(checked)) {
    if (existsSync(source) && !isHermesEdition(source) && !isHermesEdition(target)) {
        for (const name of ['Local Storage', 'IndexedDB', 'Session Storage']) {
            const from = path.join(target, name);
            if (existsSync(from)) {
                try {
                    renameSync(from, `${from} (from Feishin, ${Date.now()})`);
                } catch (error) {
                    console.error('Could not move the copied Feishin settings', error);
                }
            }
        }
    }
    try {
        writeFileSync(checked, '');
    } catch {
        // read-only settings folder: check again next time
    }
}

if (
    !existsSync(target) &&
    existsSync(source) &&
    path.resolve(source) !== path.resolve(target) &&
    isHermesEdition(source)
) {
    try {
        cpSync(source, target, {
            filter: (file) => !/^(Singleton|lockfile$|LOCK$)/.test(path.basename(file)),
            recursive: true,
        });
        writeFileSync(checked, '');
    } catch (error) {
        console.error('Could not copy the Feishin settings', error);
    }
}
