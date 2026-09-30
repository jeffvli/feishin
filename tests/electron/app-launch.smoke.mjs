import electronPath from 'electron';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../..');
const resultDirectory = path.join(repositoryRoot, 'test-results', 'electron');

test('KatiesAmp launches and renders its initial screen', { timeout: 60_000 }, async (context) => {
    const appDataDirectory = await mkdtemp(path.join(os.tmpdir(), 'katiesamp-smoke-'));
    await mkdir(resultDirectory, { recursive: true });

    const pageErrors = [];
    const electronApp = await electron.launch({
        args: [repositoryRoot],
        env: {
            ...process.env,
            APPDATA: appDataDirectory,
            DISABLE_AUTO_UPDATES: '1',
        },
        executablePath: electronPath,
        timeout: 30_000,
    });

    context.after(async () => {
        await electronApp.close().catch(() => undefined);
        await rm(appDataDirectory, { force: true, recursive: true });
    });

    const window = await electronApp.firstWindow();
    window.on('pageerror', (error) => pageErrors.push(error.message));

    await window.waitForLoadState('domcontentloaded');
    await window.waitForFunction(() => document.body.childElementCount > 0);
    await window.waitForFunction(() => (document.body.innerText || '').trim().length > 0, null, {
        timeout: 20_000,
    });
    await window.screenshot({ path: path.join(resultDirectory, 'initial-screen.png') });

    const appName = await electronApp.evaluate(({ app }) => app.getName());
    const renderedText = (await window.locator('body').innerText()).trim();

    assert.equal(appName, 'KatiesAmp');
    assert.ok(renderedText.length > 0, 'The initial screen should contain rendered text.');
    assert.deepEqual(pageErrors, [], `Renderer errors: ${pageErrors.join('; ')}`);
});
