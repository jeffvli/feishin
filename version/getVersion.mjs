import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/**
 * Cache app version. Just to prevent multiple reading from fs
 * @type {null|string}
 */
let CACHED_VERSION = null;

/**
 * Entry function for get app version.
 * By default, it returns `version` from `package.json`, but you can implement any logic here.
 * Runs several times for each vite configs and electron-builder config.
 * @param {string} [root=process.cwd()] Project root path. Needed for current implementation. Indicate where to find `package.json`
 * @return {string}
 */
export function getVersion(root = process.cwd()) {
  if (CACHED_VERSION === null) {
    CACHED_VERSION = JSON.parse(
      readFileSync(resolve(root, 'package.json'), {encoding: 'utf8'}),
    ).version;
  }
  return CACHED_VERSION;
}
