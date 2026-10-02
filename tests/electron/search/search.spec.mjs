import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('@full provides one global track-only results page', async ({ mockJellyfin, page }) => {
    const search = page.getByRole('textbox', { name: 'Search tracks or artists' });
    await expect(search).toBeVisible();
    await expect(page.locator('#left-sidebar').getByRole('textbox')).toHaveCount(0);

    await navigateTo(page, '/library/albums');
    await expect(page.getByText('Automation Album', { exact: true })).toBeVisible({
        timeout: 15_000,
    });
    await expect(page.getByRole('textbox')).toHaveCount(1);

    await search.fill('Automation');
    const suggestions = page.getByRole('dialog', { name: 'Search suggestions' });
    await expect(suggestions).toBeVisible();
    await expect(
        suggestions.getByRole('button', { exact: true, name: 'Automation Artist' }),
    ).toBeVisible();
    const artistImageContainer = suggestions
        .getByRole('button', { exact: true, name: 'Automation Artist' })
        .locator('div')
        .first();
    await expect(artistImageContainer).toHaveCSS('height', '40px');
    await expect(artistImageContainer).toHaveCSS('width', '40px');
    await expect(suggestions.getByText('Automation Track 1', { exact: true })).toBeVisible();
    const trackSuggestion = suggestions.getByTestId('search-suggestion-song-song-1');
    await expect(trackSuggestion.getByRole('button')).toHaveCount(0);
    await trackSuggestion.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { exact: true, name: 'Play' }).first()).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Track radio' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await search.focus();
    await expect(suggestions).toBeVisible();

    await suggestions.getByRole('button', { exact: true, name: 'Automation Artist' }).click();
    await expect
        .poll(() => new URL(page.url()).hash)
        .toContain('/search/song?query=Automation+Artist');
    await expect(page.getByRole('heading', { name: 'Artists' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Tracks' })).toBeVisible();
    await expect(page.getByText('Automation Track 1', { exact: true })).toBeVisible();
    await expect(page.getByText('ALBUM', { exact: true })).toBeVisible();
    await expect(page.getByText('0:03', { exact: true }).first()).toBeVisible();
    const resultTrack = getSongCell(page, 'Automation Track 1');
    await resultTrack.click({ button: 'right' });
    for (const label of ['Play', 'Download for offline use', 'Get info']) {
        await expect(
            page.getByRole('menuitem', { exact: true, name: label }).first(),
        ).toBeVisible();
    }
    await expect(page.getByRole('menuitem', { name: 'Track radio' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByText('External links', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Artist radio', { exact: false })).toHaveCount(0);

    await search.fill('Automation Track 1');
    await search.press('Enter');
    await expect
        .poll(() => new URL(page.url()).hash)
        .toContain('/search/song?query=Automation+Track+1');
    await expect(page.getByRole('heading', { name: 'Tracks' })).toBeVisible();
    await expect(page.getByText('Automation Track 1', { exact: true })).toBeVisible();

    await expect
        .poll(() =>
            ['Automation Artist', 'Automation Track 1'].every((searchTerm) =>
                mockJellyfin.state.requests.some((request) => {
                    const query = Object.fromEntries(
                        Object.entries(request.query).map(([key, value]) => [
                            key.toLowerCase(),
                            value,
                        ]),
                    );
                    return (
                        request.pathname.toLowerCase() === '/users/test-user/items' &&
                        query.includeitemtypes === 'Audio' &&
                        query.parentid === 'music-folder-1' &&
                        query.searchterm === searchTerm
                    );
                }),
            ),
        )
        .toBe(true);
    await expect
        .poll(() =>
            mockJellyfin.state.requests.some((request) => {
                const query = Object.fromEntries(
                    Object.entries(request.query).map(([key, value]) => [key.toLowerCase(), value]),
                );
                return (
                    request.pathname.toLowerCase() === '/users/test-user/items' &&
                    query.includeitemtypes === 'Audio' &&
                    query.parentid === 'music-folder-1' &&
                    query.artistids === 'artist-1'
                );
            }),
        )
        .toBe(true);
});

test('@full executes queue actions from a search suggestion context menu', async ({ page }) => {
    const search = page.getByRole('textbox', { name: 'Search tracks or artists' });

    await search.fill('Automation Track 2');
    const suggestion = page.getByTestId('search-suggestion-song-song-2');
    await expect(suggestion).toBeVisible();
    await suggestion.click({ button: 'right' });

    const playMenu = page.getByRole('menuitem', { exact: true, name: 'Play' }).first();
    await playMenu.hover();
    await page.getByRole('menuitem', { exact: true, name: 'Next' }).click();

    await page.getByRole('button', { name: 'View queue' }).click();
    const queue = page.locator('#sidebar-queue');
    await expect(queue).toBeVisible();
    await expect(queue.getByText('Automation Track 2', { exact: true })).toBeVisible();
});

test('@full drags a search result into a specific queue position', async ({ page }) => {
    const album = page.locator('#left-sidebar').getByText('Automation Album', { exact: true });
    await expect(album).toBeVisible({ timeout: 15_000 });
    await album.click({ button: 'right' });
    await page.getByRole('menuitem', { exact: true, name: 'Add to end of queue' }).click();

    await page.getByRole('button', { name: 'View queue' }).click();
    const queue = page.locator('#sidebar-queue');
    await expect(queue).toBeVisible();
    const queueTrackNames = queue.getByText(/^Automation Track \d$/, { exact: true });
    await expect(queueTrackNames).toHaveCount(6);

    const search = page.getByRole('textbox', { name: 'Search tracks or artists' });
    await search.fill('Automation Track 6');
    await search.press('Enter');

    const source = page.getByRole('main').getByText('Automation Track 6', { exact: true });
    const target = queue.getByText('Automation Track 2', { exact: true });
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Search result or queue target is not visible');

    await page.mouse.move(sourceBox.x + 10, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + 10, targetBox.y + 1, { steps: 12 });
    await page.mouse.up();

    await expect(queueTrackNames).toHaveCount(7);
    await expect
        .poll(async () => queueTrackNames.allTextContents())
        .toEqual([
            'Automation Track 1',
            'Automation Track 6',
            'Automation Track 2',
            'Automation Track 3',
            'Automation Track 4',
            'Automation Track 5',
            'Automation Track 6',
        ]);
});
