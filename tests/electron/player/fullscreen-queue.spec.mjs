import { expect, login, test } from '../fixtures/katiesamp-test.mjs';

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('@full opens the fullscreen queue from the player-bar queue button', async ({ page }) => {
    const album = page.locator('#left-sidebar').getByText('Automation Album', { exact: true });
    await expect(album).toBeVisible({ timeout: 15_000 });
    await album.click({ button: 'right' });
    await page.getByRole('menuitem', { exact: true, name: 'Add to end of queue' }).click();

    await page.locator('.media-player').dispatchEvent('dblclick', { button: 0 });

    const fullscreenQueue = page.locator('.full-screen-player-queue-container');
    await expect(fullscreenQueue).toBeVisible();
    await expect(fullscreenQueue.getByText('Automation Track 1', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'View queue' }).click();

    await expect(fullscreenQueue.getByText('Automation Track 1', { exact: true })).toBeVisible();
    await expect(page.locator('#sidebar-queue')).toHaveCount(0);

    await page.getByRole('button', { name: 'View queue' }).click();
    await expect(fullscreenQueue.getByText('Automation Track 1', { exact: true })).toHaveCount(0);
    await expect(page.locator('#sidebar-queue')).toHaveCount(0);
});
