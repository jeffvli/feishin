import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length > 3) {
    console.error('Usage: node update-app-stream.js [package-file] [date] [metainfo-file]');
    process.exit(1);
}

const packageFile = args[0] || path.resolve(process.cwd(), 'package.json');

const packageContent = fs.readFileSync(packageFile, 'utf8');
const packageJson = JSON.parse(packageContent);
const version = packageJson.version;

const time = Math.floor((Date.parse(args[1]) || Date.now()) / 1000);
const metainfoFile = args[2] || path.resolve(process.cwd(), 'org.jeffvli.feishin.metainfo.xml');

const parser = new XMLParser({ ignoreAttributes: false });
const metainfoContent = fs.readFileSync(metainfoFile, 'utf8');
const metainfo = parser.parse(metainfoContent);

if (!metainfo.component.releases.release.find((release) => release['@_version'] === version)) {
    metainfo.component.releases.release.unshift({
        '@_date': new Date(time * 1000).toISOString().split('T')[0],
        '@_type': version.includes('-') ? 'development' : 'stable',
        '@_version': version,
    });
}

const builder = new XMLBuilder({ format: true, ignoreAttributes: false, indentBy: '  ' });
fs.writeFileSync(metainfoFile, builder.build(metainfo), 'utf8');

console.log(`Updated ${metainfoFile} with version ${version}`);
