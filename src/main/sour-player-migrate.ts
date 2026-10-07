import { app } from 'electron';
import { cpSync, existsSync } from 'fs';
import path from 'path';

// Sour Player keeps its own settings folder, so it never mixes with (or gets replaced by) the official
// Feishin. The first time it starts, it copies the settings, servers and theme from an existing
// Feishin install. Imported before anything else reads the settings folder.
const target = app.getPath('userData');
const source = path.join(app.getPath('appData'), 'feishin');

if (!existsSync(target) && existsSync(source) && path.resolve(source) !== path.resolve(target)) {
    try {
        cpSync(source, target, {
            filter: (file) => !/^(Singleton|lockfile$|LOCK$)/.test(path.basename(file)),
            recursive: true,
        });
    } catch (error) {
        console.error('Could not copy the Feishin settings', error);
    }
}
