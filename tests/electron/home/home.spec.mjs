import { expect, login, test } from '../fixtures/katiesamp-test.mjs';

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
    await selector.click();
    await expect(page.getByRole('option', { name: "Katie O'Brien's Music" })).toBeVisible();
});
