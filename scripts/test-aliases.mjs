// Resolves the /@/ path aliases of tsconfig.web.json for `node --test`, which runs the TypeScript sources as is.
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The package root npm scripts run from. Not this file's own location, which resolves symlinks and would
// send a mutation testing overlay back to the original sources.
const root = process.cwd();

registerHooks({
    resolve(specifier, context, nextResolve) {
        const match = /^\/@\/(i18n|main|remote|renderer|shared)\/(.+)$/.exec(specifier);
        if (!match) {
            return nextResolve(specifier, context);
        }

        const base = path.join(root, 'src', match[1], match[2]);
        const file = ['.ts', '.tsx', '/index.ts', ''].map((ext) => base + ext).find(existsSync);

        return nextResolve(pathToFileURL(file ?? base).href, context);
    },
});
