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

test('@full keeps the album detail screen focused on playback', async ({ page }) => {
    await navigateTo(page, '/library/albums/album-1');
    const heading = page.getByRole('heading', { level: 1, name: 'Automation Album' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const header = heading.locator('..');
    for (const label of ['Play', 'Shuffle', 'Download']) {
        const button = header.getByRole('button', { exact: true, name: label });
        await expect(button).toBeVisible();
        await expect(button.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(header.getByRole('button', { exact: true, name: 'Next' })).toHaveCount(0);
    await expect(header.getByRole('button', { exact: true, name: 'Last' })).toHaveCount(0);
    await expect(header.getByRole('button', { exact: true, name: 'Album radio' })).toHaveCount(0);
    await expect(header.getByRole('link', { exact: true, name: 'Automation Artist' })).toHaveCount(
        0,
    );
    const main = page.getByRole('main');
    await expect(main.getByText(/^Genres?$/)).toHaveCount(0);
    await expect(main.getByText('External links', { exact: true })).toHaveCount(0);
});

test('@full labels the sidebar album list with the selected music folder', async ({
    mockJellyfin,
    page,
}) => {
    const selector = page.getByRole('combobox', { name: 'Select music folder' });
    await selector.click();
    await page.getByRole('option', { name: "Katie O'Brien's Music" }).click();

    const sidebar = page.locator('#left-sidebar');
    await expect(
        sidebar.getByRole('button', { exact: true, name: "Katie O'Brien's Music" }),
    ).toBeVisible();
    await expect(sidebar.getByText('Automation Album', { exact: true })).toBeVisible();
    await sidebar.getByText('Automation Album', { exact: true }).click({ button: 'right' });
    for (const label of ['Play', 'Shuffle', 'Play next', 'Add to end of queue']) {
        await expect(page.getByRole('menuitem', { exact: true, name: label })).toBeVisible();
    }
    await expect(
        page.getByRole('menuitem', { exact: true, name: 'Keep album available offline' }),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Album radio' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Share item' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Edit Metadata' })).toHaveCount(0);
    await expect
        .poll(() =>
            mockJellyfin.state.requests.some((request) => {
                const query = Object.fromEntries(
                    Object.entries(request.query).map(([key, value]) => [key.toLowerCase(), value]),
                );
                return (
                    request.pathname.toLowerCase() === '/users/test-user/items' &&
                    query.includeitemtypes?.includes('MusicAlbum') &&
                    query.limit === '10'
                );
            }),
        )
        .toBe(true);
});
