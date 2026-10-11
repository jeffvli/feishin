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
export const packageVersion = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
).version;

const isExpectedMediaCancellation = (message) =>
    message.startsWith('The play() request was interrupted by a new load request.') ||
    message.startsWith('The play() request was interrupted by a call to pause().');

export const launchKatiesAmp = ({ mockJellyfin, serverLock = 'true', userDataDirectory }) => {
    const packagedExecutablePath = process.env.KATIESAMP_EXECUTABLE_PATH;
    const args = [`--user-data-dir=${userDataDirectory}`];
    if (!packagedExecutablePath) args.push(repositoryRoot);

    return electron.launch({
        args,
        env: {
            ...process.env,
            APPDATA: userDataDirectory,
            DISABLE_AUTO_UPDATES: '1',
            KATIESAMP_AUTOMATION: '1',
            SERVER_LOCK: serverLock,
            SERVER_NAME: 'KATIESMUSICSERVER',
            SERVER_TYPE: 'jellyfin',
            SERVER_URL: mockJellyfin.url,
        },
        executablePath: packagedExecutablePath || electronPath,
    });
};

export const test = base.extend({
    electronApp: async ({ mockJellyfin, serverLock, userDataDirectory }, use) => {
        const launchStartedAt = performance.now();
        const electronApp = await launchKatiesAmp({
            mockJellyfin,
            serverLock,
            userDataDirectory,
        });
        const firstWindow = await electronApp.firstWindow();
        await firstWindow.waitForLoadState('domcontentloaded');
        electronApp.katiesAmpLaunchDurationMs = performance.now() - launchStartedAt;

        await use(electronApp);

        await electronApp
            .evaluate(({ app }) => {
                app.exit(0);
            })
            .catch(() => {});
        await electronApp.close().catch(() => {});
    },
    launchDurationMs: async ({ electronApp }, use) => {
        await use(electronApp.katiesAmpLaunchDurationMs);
    },
    mockJellyfin: async ({ mockSongCount }, use) => {
        const mockJellyfin = await startMockJellyfin({ songCount: mockSongCount });
        await use(mockJellyfin);
        await mockJellyfin.close();
    },
    mockSongCount: [6, { option: true }],
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

        if (mockJellyfin.state.unexpectedRequests.length > 0) {
            await testInfo.attach('unexpected-jellyfin-requests', {
                body: Buffer.from(JSON.stringify(mockJellyfin.state.unexpectedRequests, null, 2)),
                contentType: 'application/json',
            });
        }

        const automationErrors = [
            ...errors
                .filter((message) => !isExpectedMediaCancellation(message))
                .map((message) => `Renderer exception: ${message}`),
            ...mockJellyfin.state.unexpectedRequests.map(
                (request) =>
                    `Unexpected Jellyfin request: ${request.method} ${request.pathname}${request.search}`,
            ),
        ];
        expect(
            automationErrors,
            'Electron automation emitted errors that were not asserted by the test',
        ).toEqual([]);
    },
    serverLock: ['true', { option: true }],
    // Playwright requires object destructuring even when a fixture has no dependencies.
    // eslint-disable-next-line no-empty-pattern
    userDataDirectory: async ({}, use) => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'katiesamp-ui-'));
        await use(directory);
        await rm(directory, { force: true, maxRetries: 5, recursive: true, retryDelay: 200 });
    },
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
