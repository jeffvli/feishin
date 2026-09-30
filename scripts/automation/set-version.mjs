import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(?:-beta\.\d+)?$/.test(version)) {
    throw new Error(`Invalid KatiesAmp release version: ${version || '(missing)'}`);
}

const packagePath = path.resolve('package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
packageJson.version = version;

await writeFile(packagePath, `${JSON.stringify(packageJson, null, 4)}\n`, 'utf8');
console.log(`KatiesAmp version set to ${version}`);
