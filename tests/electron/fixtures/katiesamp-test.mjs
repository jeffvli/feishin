import { test as base, _electron as electron, expect } from '@playwright/test';
import electronPath from 'electron';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { startMockJellyfin } from './mock-jellyfin.mjs';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, '../../..');
const packageVersion = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
).version;

export const test = base.extend({
    electronApp: async ({ mockJellyfin, serverLock }, use) => {
        const userDataDirectory = await mkdtemp(path.join(os.tmpdir(), 'katiesamp-ui-'));
        const electronApp = await electron.launch({
            args: [`--user-data-dir=${userDataDirectory}`, repositoryRoot],
            env: {
                ...process.env,
                APPDATA: userDataDirectory,
                DISABLE_AUTO_UPDATES: '1',
                SERVER_LOCK: serverLock,
                SERVER_NAME: 'KATIESMUSICSERVER',
                SERVER_TYPE: 'jellyfin',
                SERVER_URL: mockJellyfin.url,
            },
            executablePath: electronPath,
        });

        await use(electronApp);

        await electronApp.close().catch(() => {});
        await rm(userDataDirectory, { force: true, recursive: true });
    },
    // Playwright requires object destructuring even when a fixture has no dependencies.
    // eslint-disable-next-line no-empty-pattern
    mockJellyfin: async ({}, use) => {
        const mockJellyfin = await startMockJellyfin();
        await use(mockJellyfin);
        await mockJellyfin.close();
    },
    page: async ({ electronApp, mockJellyfin }, use, testInfo) => {
        const page = await electronApp.firstWindow();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.waitForLoadState('domcontentloaded');
        await page.evaluate(
            (version) => localStorage.setItem('version', JSON.stringify(version)),
            packageVersion,
        );
        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        const dismissButton = page.getByRole('button', { name: 'Dismiss' });
        if (await dismissButton.isVisible().catch(() => false)) await dismissButton.click();

        await use(page);

        if (testInfo.status !== testInfo.expectedStatus) {
            const screenshotPath = testInfo.outputPath('failure.png');
            await page.screenshot({ fullPage: true, path: screenshotPath }).catch(() => {});
            await testInfo.attach('failure-screenshot', {
                contentType: 'image/png',
                path: screenshotPath,
            });
        }

        const tracePath = testInfo.outputPath('trace.zip');
        await page.context().tracing.stop({ path: tracePath });
        await testInfo.attach('trace', { contentType: 'application/zip', path: tracePath });

        if (errors.length > 0) {
            await testInfo.attach('renderer-errors', {
                body: Buffer.from(errors.join('\n')),
                contentType: 'text/plain',
            });
        }

        await testInfo.attach('jellyfin-requests', {
            body: Buffer.from(JSON.stringify(mockJellyfin.state.requests, null, 2)),
            contentType: 'application/json',
        });
    },
    serverLock: ['true', { option: true }],
});

export { expect };

export const getSongCell = (page, name) =>
    page
        .getByText(name, { exact: true })
        .locator('xpath=ancestor::div[@data-row-index][1]')
        .first();

export const login = async (page, credentials = {}) => {
    await page.getByLabel('Username').fill(credentials.username || 'Admin');
    await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password || 'password');
    await page.getByRole('button', { name: /^(Add|Login)$/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'KatiesAmp' })).toBeVisible({
        timeout: 20_000,
    });
    await page
        .getByRole('button', { name: 'Dismiss' })
        .click({ timeout: 2_000 })
        .catch(() => {});
};

export const navigateTo = async (page, route) => {
    await page.evaluate((nextRoute) => {
        window.location.hash = `#${nextRoute}`;
    }, route);
};
