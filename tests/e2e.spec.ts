import type {ElectronApplication} from 'playwright';
import {_electron as electron} from 'playwright';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {createHash} from 'crypto';

let electronApp: ElectronApplication;

beforeAll(async () => {
  electronApp = await electron.launch({args: ['.']});
});

afterAll(async () => {
  await electronApp.close();
});

test('Main window state', async () => {
  const windowState: {isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean} =
    await electronApp.evaluate(({BrowserWindow}) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];

      const getState = () => ({
        isVisible: mainWindow.isVisible(),
        isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
        isCrashed: mainWindow.webContents.isCrashed(),
      });

      return new Promise(resolve => {
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
      });
    });

  expect(windowState.isCrashed, 'The app has crashed').toBeFalsy();
  expect(windowState.isVisible, 'The main window was not visible').toBeTruthy();
  expect(windowState.isDevToolsOpened, 'The DevTools panel was open').toBeFalsy();
});

test('Main window web content', async () => {
  const page = await electronApp.firstWindow();
  const element = await page.$('#app', {strict: true});
  expect(element, 'Was unable to find the root element').toBeDefined();
  expect((await element.innerHTML()).trim(), 'Window content was empty').not.equal('');
});

test('Preload versions', async () => {
  const page = await electronApp.firstWindow();
  const renderedVersions = await page.locator('#process-versions').innerText();

  const expectedVersions = await electronApp.evaluate(() => process.versions);

  for (const expectedVersionsKey in expectedVersions) {
    expect(renderedVersions).include(
      `${expectedVersionsKey}: v${expectedVersions[expectedVersionsKey]}`,
    );
  }
});

test('Preload nodeCrypto', async () => {
  const page = await electronApp.firstWindow();

  // Test hashing a random string
  const testString = Math.random().toString(36).slice(2, 7);

  await page.fill('input', testString);
  const renderedHash = await page.inputValue('input[readonly]');
  const expectedHash = createHash('sha256').update(testString).digest('hex');
  expect(renderedHash).toEqual(expectedHash);
});
