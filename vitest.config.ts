import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// Minimal vitest setup for the listen-together sync unit tests. Mirrors the path
// aliases from electron.vite.config.ts so `/@/...` imports resolve.
export default defineConfig({
    resolve: {
        alias: {
            '/@/i18n': resolve('src/i18n'),
            '/@/main': resolve('src/main'),
            '/@/preload': resolve('src/preload'),
            '/@/remote': resolve('src/remote'),
            '/@/renderer': resolve('src/renderer'),
            '/@/shared': resolve('src/shared'),
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
