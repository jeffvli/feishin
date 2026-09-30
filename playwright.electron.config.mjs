import { defineConfig } from '@playwright/test';

export default defineConfig({
    expect: {
        timeout: 10_000,
    },
    forbidOnly: Boolean(process.env.CI),
    fullyParallel: false,
    outputDir: 'test-results/electron/artifacts',
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/electron/report' }]],
    retries: process.env.CI ? 1 : 0,
    testDir: 'tests/electron',
    testMatch: '**/*.spec.mjs',
    timeout: 45_000,
    workers: 1,
});
