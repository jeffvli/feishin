import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '/@/i18n': resolve(__dirname, 'src/i18n'),
            '/@/remote': resolve(__dirname, 'src/remote'),
            '/@/renderer': resolve(__dirname, 'src/renderer'),
            '/@/shared': resolve(__dirname, 'src/shared'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/renderer/utils/**/*.test.ts', 'src/renderer/utils/**/*.test.tsx'],
        coverage: {
            reporter: ['text', 'html'],
        },
    },
});


