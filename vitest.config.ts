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
        coverage: {
            include: ['src/**/*.{ts,tsx}'],
            provider: 'v8',
            reporter: ['text', 'html'],
        },
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
