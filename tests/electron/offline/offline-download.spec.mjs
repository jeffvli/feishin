import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

test('@nightly offers offline download for a Jellyfin song', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/library/songs');
    const song = getSongCell(page, 'Automation Track 1');
    await expect(song).toBeVisible({ timeout: 15_000 });
    await song.click({ button: 'right' });
    await expect(page.getByText('Download for offline use', { exact: true })).toBeVisible();
});
