import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '/@/i18n': resolve('src/i18n'),
            '/@/main': resolve('src/main'),
            '/@/renderer': resolve('src/renderer'),
            '/@/shared': resolve('src/shared'),
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
