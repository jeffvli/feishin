import react from '@vitejs/plugin-react';
import { externalizeDepsPlugin, UserConfig } from 'electron-vite';
import { resolve } from 'path';
import conditionalImportPlugin from 'vite-plugin-conditional-import';
import dynamicImportPlugin from 'vite-plugin-dynamic-import';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

const currentOSEnv = process.platform;
const electronRendererTarget = 'chrome87';

const config: UserConfig = {
    main: {
        build: {
            rollupOptions: {
                external: ['source-map-support'],
            },
            sourcemap: true,
        },
        define: {
            'import.meta.env.IS_LINUX': JSON.stringify(currentOSEnv === 'linux'),
            'import.meta.env.IS_MACOS': JSON.stringify(currentOSEnv === 'darwin'),
            'import.meta.env.IS_WIN': JSON.stringify(currentOSEnv === 'win32'),
        },
        plugins: [
            externalizeDepsPlugin(),
            dynamicImportPlugin(),
            conditionalImportPlugin({
                currentEnv: currentOSEnv,
                envs: ['win32', 'linux', 'darwin'],
            }),
        ],
        resolve: {
            alias: {
                '/@/main': resolve('src/main'),
                '/@/shared': resolve('src/shared'),
            },
        },
    },
    preload: {
        build: {
            sourcemap: true,
        },
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '/@/preload': resolve('src/preload'),
                '/@/shared': resolve('src/shared'),
            },
        },
    },
    renderer: {
        build: {
            cssMinify: 'esbuild',
            minify: 'esbuild',
            modulePreload: {
                polyfill: false,
            },
            sourcemap: true,
            target: electronRendererTarget,
        },
        css: {
            modules: {
                generateScopedName: 'fs-[name]-[local]',
                localsConvention: 'camelCase',
            },
        },
        plugins: [react(), ViteEjsPlugin({ web: false })],
        resolve: {
            alias: {
                '/@/i18n': resolve('src/i18n'),
                '/@/remote': resolve('src/remote'),
                '/@/renderer': resolve('src/renderer'),
                '/@/shared': resolve('src/shared'),
            },
        },
    },
};

export default config;
