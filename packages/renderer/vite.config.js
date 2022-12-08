/* eslint-env node */

import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { renderer } from 'unplugin-auto-expose';
import { chrome } from '../../.electron-vendors.cache.json';
import { injectAppVersion } from '../../version/inject-app-version-plugin.mjs';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  base: '',
  build: {
    assetsDir: '.',
    emptyOutDir: true,
    outDir: 'dist',
    reportCompressedSize: false,
    rollupOptions: {
      input: join(PACKAGE_ROOT, 'index.html'),
    },
    sourcemap: true,
    target: `chrome${chrome}`,
  },
  envDir: PROJECT_ROOT,
  mode: process.env.MODE,
  plugins: [
    react(),
    renderer.vite({
      preloadEntry: join(PACKAGE_ROOT, '../preload/src/index.ts'),
    }),
    injectAppVersion(PROJECT_ROOT),
  ],
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  root: PACKAGE_ROOT,
  server: {
    fs: {
      strict: true,
    },
  },
  test: {
    environment: 'happy-dom',
  },
};

export default config;
