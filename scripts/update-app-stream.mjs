import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

// Parse flags and positional arguments
const flags = args.filter((arg) => arg.startsWith('--'));
const positionalArgs = args.filter((arg) => !arg.startsWith('--'));
const replaceIfVersionMissing = flags.includes('--replace-if-version-missing');

if (positionalArgs.length > 3) {
    console.error(
        'Usage: node update-app-stream.js [package-file] [date] [metainfo-file] [--replace-if-version-missing]',
    );
    process.exit(1);
}

const packageFile = positionalArgs[0] || path.resolve(process.cwd(), 'package.json');

const packageContent = fs.readFileSync(packageFile, 'utf8');
const packageJson = JSON.parse(packageContent);
const version = packageJson.version;

const time = Math.floor((Date.parse(positionalArgs[1]) || Date.now()) / 1000);
const metainfoFile =
    positionalArgs[2] || path.resolve(process.cwd(), 'org.jeffvli.feishin.metainfo.xml');

const parser = new XMLParser({ ignoreAttributes: false });
const metainfoContent = fs.readFileSync(metainfoFile, 'utf8');
const metainfo = parser.parse(metainfoContent);

const newRelease = {
    '@_date': new Date(time * 1000).toISOString().split('T')[0],
    '@_type': version.includes('-') ? 'development' : 'stable',
    '@_version': version,
};

if (replaceIfVersionMissing) {
    // Replace all releases with only the current version
    metainfo.component.releases.release = [newRelease];
} else {
    // Default behavior: add new release if it doesn't exist
    const releaseExists =
        metainfo.component.releases.release.findIndex(
            (release) => release['@_version'] === version,
        ) !== -1;
    if (!releaseExists) {
        metainfo.component.releases.release.unshift(newRelease);
    }
}

const builder = new XMLBuilder({ format: true, ignoreAttributes: false, indentBy: '  ' });
fs.writeFileSync(metainfoFile, builder.build(metainfo), 'utf8');

console.log(`Updated ${metainfoFile} with version ${version}`);
