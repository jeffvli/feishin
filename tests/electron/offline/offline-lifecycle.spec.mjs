import {
    expect,
    getSongCell,
    launchKatiesAmp,
    login,
    navigateTo,
    packageVersion,
    test,
} from '../fixtures/katiesamp-test.mjs';

const tasks = (page) => page.evaluate(() => window.api.offline.listDownloadTasks());

const latestTask = async (page) => (await tasks(page)).at(-1);

const waitForTaskState = (page, state) =>
    expect.poll(async () => (await latestTask(page))?.state, { timeout: 20_000 }).toBe(state);

const downloadAlbum = async (page) => {
    await navigateTo(page, '/library/albums/album-1');
    const heading = page.getByRole('heading', { level: 1, name: 'Automation Album' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await heading.locator('..').getByRole('button', { exact: true, name: 'Download' }).click();
};

const downloadSong = async (page, name = 'Automation Track 1') => {
    await navigateTo(page, '/library/songs');
    const song = getSongCell(page, name);
    await expect(song).toBeVisible({ timeout: 15_000 });
    await song.click({ button: 'right' });
    await page.getByText('Download for offline use', { exact: true }).click();
};

const downloadsPanel = (page) => page.getByRole('dialog', { name: 'Downloads' });

const openDownloads = async (page) => {
    await page.getByRole('button', { name: 'Downloads' }).click();
    await expect(downloadsPanel(page)).toBeVisible();
    return downloadsPanel(page);
};

const queueNames = async (page) => {
    const rows = await page.locator('#sidebar-queue [data-row-index]').allInnerTexts();
    return rows.flatMap((row) => row.match(/Automation Track \d+/)?.slice(0, 1) ?? []);
};

const seekActiveTrackNearEnd = (page, secondsFromEnd = 0.15) =>
    page.evaluate((offset) => {
        const active = [...document.querySelectorAll('audio')].find((audio) => !audio.paused);
        if (!active || !Number.isFinite(active.duration)) {
            throw new Error('No active audio element is available');
        }
        active.currentTime = Math.max(0, active.duration - offset);
    }, secondsFromEnd);

test('@nightly displays live progress, supports cancellation, and retries the batch', async ({
    mockJellyfin,
    page,
}) => {
    mockJellyfin.setAudioDelay(500);
    await login(page);
    await downloadAlbum(page);
    const panel = await openDownloads(page);

    await expect
        .poll(async () => {
            const task = await latestTask(page);
            return task && task.bytesDownloaded > 0 && task.bytesDownloaded < task.bytesTotal;
        })
        .toBe(true);
    await expect(page.getByText('Downloading for offline playback', { exact: true })).toHaveCount(
        0,
    );
    const activeDownloadsButton = page.getByRole('button', {
        name: 'Downloads, 1 active download',
    });
    await expect(activeDownloadsButton).toBeVisible();
    await expect
        .poll(() => activeDownloadsButton.evaluate((element) => getComputedStyle(element).overflow))
        .toBe('visible');
    await expect
        .poll(() =>
            activeDownloadsButton.evaluate(
                (element) => getComputedStyle(element, '::after').content,
            ),
        )
        .toBe('"1"');
    await expect(panel.getByRole('progressbar')).toBeVisible();
    await panel.getByRole('button', { name: 'Cancel' }).click();
    await waitForTaskState(page, 'cancelled');
    await expect(panel.getByText('cancelled', { exact: true })).toBeVisible();

    mockJellyfin.setAudioDelay(0);
    await panel.getByRole('button', { name: 'Retry' }).click();
    await waitForTaskState(page, 'complete');
    await expect(panel.getByText('complete', { exact: true })).toBeVisible();
    await expect(panel.getByRole('progressbar', { exact: true, name: '100%' })).toBeVisible();
    await expect(page.getByText('6 items are available offline', { exact: true })).toBeVisible();
});

test('@nightly exposes a failed download and successfully retries it', async ({
    mockJellyfin,
    page,
}) => {
    mockJellyfin.setFailedDownloadIds(['song-2']);
    await login(page);
    await downloadAlbum(page);
    await waitForTaskState(page, 'error');
    await expect(page.getByText(/Download failed with HTTP 503/)).toBeVisible();
    const panel = await openDownloads(page);

    await expect(panel.getByText('error', { exact: true })).toBeVisible();
    await expect(panel.getByText(/Download failed with HTTP 503/)).toBeVisible();
    mockJellyfin.setFailedDownloadIds([]);
    await panel.getByRole('button', { name: 'Retry' }).click();
    await waitForTaskState(page, 'complete');
});

test('@nightly restores completed download history after an application restart', async ({
    electronApp,
    mockJellyfin,
    userDataDirectory,
}) => {
    const firstPage = await electronApp.firstWindow();
    await firstPage.evaluate(
        (version) => localStorage.setItem('version', JSON.stringify(version)),
        packageVersion,
    );
    await login(firstPage);
    await downloadSong(firstPage);
    await waitForTaskState(firstPage, 'complete');
    await electronApp.close();

    const restartedApp = await launchKatiesAmp({ mockJellyfin, userDataDirectory });
    try {
        const restartedPage = await restartedApp.firstWindow();
        await expect(restartedPage.getByRole('button', { name: 'Downloads' })).toBeVisible({
            timeout: 20_000,
        });
        const panel = await openDownloads(restartedPage);
        await expect(panel.getByText('Automation Track 1', { exact: true })).toBeVisible();
        await expect(panel.getByText('complete', { exact: true })).toBeVisible();
        await expect(
            restartedPage.getByText('1 item is available offline', { exact: true }),
        ).toHaveCount(0);
    } finally {
        await restartedApp.close().catch(() => {});
    }
});

test('@nightly plays a downloaded track after the server becomes unavailable', async ({
    mockJellyfin,
    page,
}) => {
    await login(page);
    await downloadSong(page);
    await waitForTaskState(page, 'complete');

    mockJellyfin.setAvailable(false);
    const song = getSongCell(page, 'Automation Track 1');
    await song.dblclick();

    await expect(
        page.locator('.media-player').getByText('Automation Track 1', { exact: true }),
    ).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(() =>
                [...document.querySelectorAll('audio')].some((audio) =>
                    audio.currentSrc.startsWith('feishin-offline:'),
                ),
            ),
        )
        .toBe(true);
});

test('@nightly synchronizes playlist removals and changed server metadata', async ({
    mockJellyfin,
    page,
}) => {
    await login(page);
    await navigateTo(page, '/playlists');
    const playlist = page.getByText('Automation Playlist', { exact: true }).first();
    await expect(playlist).toBeVisible({ timeout: 15_000 });
    await playlist.click({ button: 'right' });
    await page.getByText('Keep playlist available offline', { exact: true }).click();
    await waitForTaskState(page, 'complete');
    await expect
        .poll(() => page.evaluate(() => window.api.offline.list().then((items) => items.length)))
        .toBe(6);

    await playlist.click();
    const heading = page.getByRole('heading', { level: 1, name: 'Automation Playlist' });
    await expect(heading).toBeVisible();

    const downloadsBeforeMetadataChange = mockJellyfin.state.requests.filter((request) =>
        request.pathname.toLowerCase().includes('/items/song-1/download'),
    ).length;
    mockJellyfin.setPlaylistSongIds(['song-1', 'song-2']);
    mockJellyfin.updateSong('song-1', {
        DateCreated: '2026-02-01T00:00:00.000Z',
        Name: 'Automation Track 1 Updated',
    });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    await expect
        .poll(() => page.evaluate(() => window.api.offline.list().then((items) => items.length)), {
            timeout: 20_000,
        })
        .toBe(2);
    await expect
        .poll(
            () =>
                mockJellyfin.state.requests.filter((request) =>
                    request.pathname.toLowerCase().includes('/items/song-1/download'),
                ).length,
        )
        .toBeGreaterThan(downloadsBeforeMetadataChange);
    const managedPlaylist = await page.evaluate(() =>
        window.api.offline.listPlaylists().then((items) => items[0]),
    );
    expect(managedPlaylist.songIds).toEqual(['song-1', 'song-2']);
});

test('@nightly removes a server-deleted download from the queue and continues playback', async ({
    mockJellyfin,
    page,
}) => {
    await login(page);
    await downloadAlbum(page);
    await waitForTaskState(page, 'complete');
    await expect
        .poll(() => page.evaluate(() => window.api.offline.list().then((items) => items.length)))
        .toBe(6);

    await navigateTo(page, '/library/songs');
    const firstSong = getSongCell(page, 'Automation Track 1');
    await expect(firstSong).toBeVisible({ timeout: 15_000 });
    await firstSong.dblclick();
    await page.getByRole('button', { name: 'View queue' }).click();
    await expect.poll(() => queueNames(page)).toContain('Automation Track 2');

    mockJellyfin.removeSong('song-2');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    await expect
        .poll(() => page.evaluate(() => window.api.offline.list().then((items) => items.length)), {
            timeout: 20_000,
        })
        .toBe(5);
    await expect.poll(() => queueNames(page)).not.toContain('Automation Track 2');
    await expect(
        page.locator('.media-player').getByText('Automation Track 1', { exact: true }),
    ).toBeVisible();

    await seekActiveTrackNearEnd(page);
    await expect(
        page.locator('.media-player').getByText('Automation Track 3', { exact: true }),
    ).toBeVisible({ timeout: 10_000 });
});
