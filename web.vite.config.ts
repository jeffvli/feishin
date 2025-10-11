import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, normalizePath } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    build: {
        emptyOutDir: true,
        outDir: path.resolve(__dirname, './out/web'),
        rollupOptions: {
            input: {
                '32x32': normalizePath(path.resolve(__dirname, './assets/icons/32x32.png')),
                '64x64': normalizePath(path.resolve(__dirname, './assets/icons/64x64.png')),
                '128x128': normalizePath(path.resolve(__dirname, './assets/icons/128x128.png')),
                '256x256': normalizePath(path.resolve(__dirname, './assets/icons/256x256.png')),
                '512x512': normalizePath(path.resolve(__dirname, './assets/icons/512x512.png')),
                '1024x1024': normalizePath(path.resolve(__dirname, './assets/icons/1024x1024.png')),
                favicon: normalizePath(path.resolve(__dirname, './assets/icons/favicon.ico')),
                index: normalizePath(path.resolve(__dirname, './src/renderer/index.html')),
                preview_full_screen_player: normalizePath(
                    path.resolve(__dirname, './media/preview_full_screen_player.png'),
                ),
            },
            output: {
                assetFileNames: 'assets/[name].[ext]',
            },
        },
        sourcemap: true,
    },
    css: {
        modules: {
            localsConvention: 'camelCase',
        },
    },
    optimizeDeps: {
        exclude: [
            '@atlaskit/pragmatic-drag-and-drop',
            '@atlaskit/pragmatic-drag-and-drop-auto-scroll',
            '@atlaskit/pragmatic-drag-and-drop-hitbox',
            '@tanstack_react-query-persist-client',
            'idb-keyval',
        ],
    },
    plugins: [
        react(),
        ViteEjsPlugin({
            root: normalizePath(path.resolve(__dirname, './src/renderer')),
            web: true,
        }),
        VitePWA({
            devOptions: {
                // The PWA will not be shown during development
                enabled: false,
            },
            filename: 'assets/sw.js',
            injectRegister: 'inline',
            manifest: {
                background_color: '#FFDCB5',
                display: 'standalone',
                icons: [
                    {
                        sizes: '32x32',
                        src: '32x32.png',
                        type: 'image/png',
                    },
                    {
                        sizes: '64x64',
                        src: '64x64.png',
                        type: 'image/png',
                    },
                    {
                        sizes: '128x128',
                        src: '128x128.png',
                        type: 'image/png',
                    },
                    {
                        sizes: '256x256',
                        src: '256x256.png',
                        type: 'image/png',
                    },
                    {
                        purpose: 'any',
                        sizes: '512x512',
                        src: '512x512.png',
                        type: 'image/png',
                    },
                    {
                        sizes: '1024x1024',
                        src: '1024x1024.png',
                        type: 'image/png',
                    },
                ],
                name: 'Feishin',
                orientation: 'portrait',
                screenshots: [
                    {
                        form_factor: 'wide',
                        label: 'Full screen player showing music player and lyrics',
                        sizes: '1440x900',
                        src: 'preview_full_screen_player.png',
                        type: 'image/png',
                    },
                ],
                short_name: 'Feishin',
                start_url: '/',
                theme_color: '#1E003D',
            },
            manifestFilename: 'assets/manifest.webmanifest',
            outDir: path.resolve(__dirname, './out/web/'),
            registerType: 'autoUpdate',
            scope: '/assets/',
            workbox: {
                maximumFileSizeToCacheInBytes: 1000000 * 5, // 5 MB
            },
        }),
    ],
    resolve: {
        alias: {
            '/@/i18n': path.resolve(__dirname, './src/i18n'),
            '/@/remote': path.resolve(__dirname, './src/remote'),
            '/@/renderer': path.resolve(__dirname, './src/renderer'),
            '/@/shared': path.resolve(__dirname, './src/shared'),
        },
    },
    root: path.resolve(__dirname, './src/renderer'),
});
