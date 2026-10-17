import {
    expect,
    getSongCell,
    login,
    navigateTo,
    packageVersion,
    test,
} from '../fixtures/katiesamp-test.mjs';

test('@full shows the ready update action beside the current version', async ({
    electronApp,
    page,
}) => {
    await login(page);

    const currentVersion = page.getByText(`v${packageVersion}`, { exact: true });
    const installUpdate = page.getByRole('button', { name: 'Install update 9.9.9' });
    await expect(currentVersion).toBeVisible();
    await expect(installUpdate).toHaveCount(0);

    await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.webContents.send('update-downloaded', '9.9.9');
    });

    await expect(installUpdate).toBeVisible();
    await expect(page.getByText('Update ready - 9.9.9', { exact: true })).toBeVisible();

    const currentVersionBox = await currentVersion.boundingBox();
    const installUpdateBox = await installUpdate.boundingBox();
    expect(currentVersionBox).not.toBeNull();
    expect(installUpdateBox).not.toBeNull();
    expect(installUpdateBox.x + installUpdateBox.width).toBeLessThanOrEqual(currentVersionBox.x);

    await installUpdate.click();
    await expect(installUpdate).toBeEnabled();
});

test('@full home layout remains readable when the application window is narrow', async ({
    electronApp,
    page,
}) => {
    await login(page);
    await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.setSize(900, 700);
    });
    await page.waitForTimeout(500);

    const label = page.getByText('Server status', { exact: true });
    const status = page.getByText('Connected to KATIESMUSICSERVER', { exact: true });
    await expect(label).toBeVisible();
    await expect(status).toBeVisible();

    const labelBox = await label.boundingBox();
    const statusBox = await status.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(statusBox).not.toBeNull();
    const overlapsHorizontally =
        labelBox.x < statusBox.x + statusBox.width && labelBox.x + labelBox.width > statusBox.x;
    const overlapsVertically =
        labelBox.y < statusBox.y + statusBox.height && labelBox.y + labelBox.height > statusBox.y;
    expect(overlapsHorizontally && overlapsVertically).toBe(false);
});

test('@full home exposes the configured music folder selector', async ({ page }) => {
    await login(page);
    const selector = page.getByRole('combobox', { name: 'Select music folder' });
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue("Katie O'Brien's Music");
    await selector.click();
    await expect(page.getByRole('option', { name: 'All music folders' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: "Katie O'Brien's Music" })).toBeVisible();
});

test('@full automatically updates a removed music folder without expiring the login', async ({
    mockJellyfin,
    page,
}) => {
    await page.clock.install();
    await login(page);
    const selector = page.getByRole('combobox', { name: 'Select music folder' });
    await expect(selector).toHaveValue("Katie O'Brien's Music");

    await navigateTo(page, '/library/songs');
    const song = getSongCell(page, 'Automation Track 1');
    await expect(song).toBeVisible({ timeout: 15_000 });
    await song.dblclick();
    await navigateTo(page, '/');
    await expect(page.getByText('Automation Track 1', { exact: true })).toBeVisible();

    mockJellyfin.setMusicFolders([{ id: 'music-folder-2', name: 'Replacement Music' }]);
    await page.clock.runFor('01:00');
    await expect(selector).toHaveValue('Replacement Music');
    await expect(page.getByText('Automation Track 1', { exact: true })).toHaveCount(0);

    mockJellyfin.setDeniedItemIds(['album-1']);
    await page.evaluate(() => {
        window.location.hash = '#/library/albums/album-1';
    });
    await expect(page.getByLabel('Username')).toHaveCount(0);
    await expect(page.getByText('Home', { exact: true })).toBeVisible();
});
