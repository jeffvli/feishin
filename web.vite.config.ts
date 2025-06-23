import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, normalizePath } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

export default defineConfig({
    base: './',
    build: {
        emptyOutDir: true,
        outDir: path.resolve(__dirname, './out/web'),
        rollupOptions: {
            input: {
                favicon: normalizePath(path.resolve(__dirname, './assets/icons/favicon.ico')),
                index: normalizePath(path.resolve(__dirname, './src/renderer/index.html')),
            },
            output: {
                assetFileNames: 'assets/[name].[ext]',
            },
        },
        sourcemap: true,
    },
    css: {
        modules: {
            generateScopedName: '[name]__[local]__[hash:base64:5]',
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
