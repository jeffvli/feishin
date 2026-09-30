import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

test('@nightly offers offline download for a Jellyfin song', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/library/songs');
    const song = getSongCell(page, 'Automation Track 1');
    await expect(song).toBeVisible({ timeout: 15_000 });
    await song.click({ button: 'right' });
    await expect(page.getByText('Download for offline use', { exact: true })).toBeVisible();
});

test('@nightly shows playback and offline status beside the sidebar album', async ({ page }) => {
    await login(page);
    const sidebar = page.locator('#left-sidebar');

    await navigateTo(page, '/library/songs');
    const song = getSongCell(page, 'Automation Track 1');
    await expect(song).toBeVisible({ timeout: 15_000 });
    await song.dblclick();

    const sidebarAlbum = sidebar
        .getByText('Automation Album', { exact: true })
        .locator('xpath=ancestor::a[1]');
    await expect(sidebarAlbum.getByRole('img', { name: 'Now Playing' })).toBeVisible();

    await navigateTo(page, '/library/albums/album-1');
    const albumHeading = page.getByRole('heading', { level: 1, name: 'Automation Album' });
    await expect(albumHeading).toBeVisible({ timeout: 15_000 });
    await albumHeading.locator('..').getByRole('button', { name: 'More options' }).click();
    await page.getByText('Keep album available offline', { exact: true }).click();

    await expect(sidebarAlbum.getByRole('img', { name: 'Available offline' })).toBeVisible({
        timeout: 15_000,
    });
});
