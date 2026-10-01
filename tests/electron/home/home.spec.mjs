import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

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

test('@full updates a removed music folder without expiring the login', async ({
    mockJellyfin,
    page,
}) => {
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
    await page.reload();
    await expect(selector).toHaveValue('Replacement Music');
    await expect(page.getByText('Automation Track 1', { exact: true })).toHaveCount(0);

    mockJellyfin.setDeniedItemIds(['album-1']);
    await page.evaluate(() => {
        window.location.hash = '#/library/albums/album-1';
    });
    await expect(page.getByLabel('Username')).toHaveCount(0);
    await expect(page.getByText('Home', { exact: true })).toBeVisible();
});
