import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

test('@nightly starts a fixture track from the songs library', async ({ mockJellyfin, page }) => {
    await login(page);
    await navigateTo(page, '/library/songs');
    const song = getSongCell(page, 'Automation Track 1');
    await expect(song).toBeVisible({ timeout: 15_000 });
    await song.dblclick();
    await expect(page.getByText('Automation Track 1', { exact: true }).last()).toBeVisible();
    await expect
        .poll(() =>
            mockJellyfin.state.requests.some(
                (request) =>
                    request.pathname.toLowerCase().includes('/audio/song-1/') ||
                    request.pathname.toLowerCase().includes('/items/song-1/download'),
            ),
        )
        .toBe(true);
});

test('@full adds a song next without interrupting the current track', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/library/album-artists/artist-1');

    const firstSong = getSongCell(page, 'Automation Track 6');
    await expect(firstSong).toBeVisible({ timeout: 15_000 });
    await firstSong.dblclick();

    const playerBar = page.locator('.media-player');
    await expect(playerBar.getByText('Automation Track 6', { exact: true })).toBeVisible();

    await getSongCell(page, 'Automation Track 2').click({ button: 'right' });
    await page.getByRole('menuitem', { exact: true, name: 'Play' }).first().hover();
    await page.getByRole('menuitem', { exact: true, name: 'Next' }).click();

    await expect(playerBar.getByText('Automation Track 6', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'View queue' }).click();
    await expect(
        page.locator('#sidebar-queue').getByText('Automation Track 2', { exact: true }).first(),
    ).toBeVisible();
});
