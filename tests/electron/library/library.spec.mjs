import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

const expectRenderedColumnCount = async (scope, itemName, expectedCount) => {
    const itemCell = scope
        .getByText(itemName, { exact: true })
        .locator('xpath=ancestor::div[@data-row-index][1]')
        .first();
    await expect(itemCell).toBeVisible({ timeout: 15_000 });
    const rowKey = await itemCell.getAttribute('data-row-index');
    expect(rowKey).toBeTruthy();
    await expect(scope.locator(`[data-row-index="${rowKey}"]`)).toHaveCount(expectedCount);
};

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

test('@full uses the clean-install navigation and content columns', async ({ page }) => {
    const sidebar = page.locator('#left-sidebar');
    for (const label of ['Home', 'Tracks', 'Artists', 'Settings']) {
        await expect(sidebar.getByText(label, { exact: true }).first()).toBeVisible();
    }
    for (const label of [
        'Now Playing',
        'Search',
        'Favorites',
        'Albums',
        'Album Artists',
        'Genres',
        'Folders',
        'Playlists',
        'Collections',
        'Radio Stations',
    ]) {
        await expect(sidebar.getByText(label, { exact: true })).toHaveCount(0);
    }

    const content = page.locator('#main-content');
    await navigateTo(page, '/library/albums');
    await expectRenderedColumnCount(content, 'Automation Album', 3);

    await navigateTo(page, '/library/artists');
    await expectRenderedColumnCount(content, 'Automation Artist', 2);

    await navigateTo(page, '/library/songs');
    await expectRenderedColumnCount(content, 'Automation Track 1', 4);

    const album = sidebar.getByText('Automation Album', { exact: true });
    await expect(album).toBeVisible({ timeout: 15_000 });
    await album.click({ button: 'right' });
    await page.getByRole('menuitem', { exact: true, name: 'Add to end of queue' }).click();
    await page.getByRole('button', { name: 'View queue' }).click();
    await expectRenderedColumnCount(page.locator('#sidebar-queue'), 'Automation Track 1', 3);
});

test('@full shows an artist as a tracks-only screen', async ({ page }) => {
    await navigateTo(page, '/library/album-artists/artist-1');

    const content = page.locator('#main-content');
    await expect(content.getByRole('heading', { name: 'Automation Artist' })).toBeVisible({
        timeout: 15_000,
    });
    await expect(getSongCell(content, 'Automation Track 1')).toBeVisible();

    for (const label of ['View discography', 'View all tracks', 'Artist radio']) {
        await expect(content.getByText(label, { exact: true })).toHaveCount(0);
    }
    await expect(content.getByRole('heading', { exact: true, name: 'Albums' })).toHaveCount(0);
    await expect(content.getByRole('button', { exact: true, name: 'Play' })).toHaveCount(0);
    await expect(content.getByRole('button', { exact: true, name: 'Next' })).toHaveCount(0);
    await expect(content.getByRole('button', { exact: true, name: 'Last' })).toHaveCount(0);
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

test('@full plays an album without combining its id with the selected folder', async ({
    mockJellyfin,
    page,
}) => {
    await navigateTo(page, '/library/albums/album-1');
    const heading = page.getByRole('heading', { level: 1, name: 'Automation Album' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await heading.locator('..').getByRole('button', { exact: true, name: 'Play' }).click();

    await expect(page.getByRole('link', { exact: true, name: 'Automation Track 1' })).toBeVisible();
    await expect
        .poll(() =>
            mockJellyfin.state.requests.some((request) => {
                const query = Object.fromEntries(
                    Object.entries(request.query).map(([key, value]) => [key.toLowerCase(), value]),
                );
                return (
                    request.pathname.toLowerCase() === '/users/test-user/items' &&
                    query.albumids === undefined &&
                    query.parentid === 'album-1'
                );
            }),
        )
        .toBe(true);
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
