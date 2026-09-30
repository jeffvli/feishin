import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('@full loads albums from Jellyfin', async ({ page }) => {
    await navigateTo(page, '/library/albums');
    await expect(page.getByText('Automation Album', { exact: true })).toBeVisible({
        timeout: 15_000,
    });
});

test('@full loads songs from Jellyfin', async ({ page }) => {
    await navigateTo(page, '/library/songs');
    await expect(getSongCell(page, 'Automation Track 1')).toBeVisible({
        timeout: 15_000,
    });
});

test('@full loads playlists from Jellyfin', async ({ page }) => {
    await navigateTo(page, '/playlists');
    await expect(page.getByText('Automation Playlist', { exact: true }).first()).toBeVisible({
        timeout: 15_000,
    });
});
