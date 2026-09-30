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
