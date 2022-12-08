import {getVersion} from './getVersion.mjs';

/**
 * Somehow inject app version to vite build context
 * @param {string} [root]
 * @return {import('vite').Plugin}
 */
export const injectAppVersion = root => ({
  name: 'inject-version',
  config: () => {
    // TODO: Find better way to inject app version
    process.env.VITE_APP_VERSION = getVersion(root);
  },
});
