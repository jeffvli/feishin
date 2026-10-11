import { defineConfig } from '@playwright/test';

const outputRoot = process.env.KATIESAMP_TEST_OUTPUT_ROOT || 'test-results/electron';

export default defineConfig({
    expect: {
        timeout: 10_000,
    },
    forbidOnly: Boolean(process.env.CI),
    fullyParallel: false,
    outputDir: `${outputRoot}/artifacts`,
    reporter: [['list'], ['html', { open: 'never', outputFolder: `${outputRoot}/report` }]],
    retries: process.env.CI ? 1 : 0,
    testDir: 'tests/electron',
    testMatch: '**/*.spec.mjs',
    timeout: 45_000,
    workers: 1,
});
