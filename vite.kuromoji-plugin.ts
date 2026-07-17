import type { Connect, Plugin } from 'vite';

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const analyzerRequire = createRequire(require.resolve('kuroshiro-analyzer-kuromoji/package.json'));
const dictionaryDirectory = path.join(
    path.dirname(analyzerRequire.resolve('kuromoji/package.json')),
    'dict',
);
const dictionaryFiles = fs
    .readdirSync(dictionaryDirectory)
    .filter((fileName) => fileName.endsWith('.dat.gz'));

const serveDictionary: Connect.NextHandleFunction = (request, response, next) => {
    const fileName = path.basename(new URL(request.url ?? '/', 'http://localhost').pathname);

    if (!dictionaryFiles.includes(fileName)) {
        next();
        return;
    }

    response.setHeader('Content-Type', 'application/gzip');
    fs.createReadStream(path.join(dictionaryDirectory, fileName)).pipe(response);
};

type KuromojiDictionaryPluginOptions = {
    emitDictionary?: boolean;
};

export const kuromojiDictionaryPlugin = ({
    emitDictionary = true,
}: KuromojiDictionaryPluginOptions = {}): Plugin => ({
    configurePreviewServer(server) {
        server.middlewares.use('/assets/kuromoji', serveDictionary);
    },
    configureServer(server) {
        server.middlewares.use('/assets/kuromoji', serveDictionary);
    },
    generateBundle() {
        if (!emitDictionary) return;

        for (const fileName of dictionaryFiles) {
            this.emitFile({
                fileName: `assets/kuromoji/${fileName}`,
                source: fs.readFileSync(path.join(dictionaryDirectory, fileName)),
                type: 'asset',
            });
        }
    },
    name: 'kuromoji-dictionary',
});
