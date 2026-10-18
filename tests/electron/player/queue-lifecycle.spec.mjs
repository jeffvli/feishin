import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

const startQueue = async (page) => {
    await login(page);
    await navigateTo(page, '/library/songs');
    const firstSong = getSongCell(page, 'Automation Track 1');
    await expect(firstSong).toBeVisible({ timeout: 15_000 });
    await firstSong.dblclick();
    await page.getByRole('button', { name: 'View queue' }).click();
    await expect(
        page.locator('#sidebar-queue').getByText('Automation Track 1').first(),
    ).toBeVisible();
};

const queueNames = async (page) => {
    const rows = await page.locator('#sidebar-queue [data-row-index]').allInnerTexts();
    return rows.flatMap((row) => row.match(/Automation Track \d+/)?.slice(0, 1) ?? []);
};

const selectQueueTrack = (page, name) =>
    page.locator('#sidebar-queue').getByText(name, { exact: true }).first().dblclick();

const waitForActiveAudio = (page) =>
    expect
        .poll(
            () =>
                page.evaluate(() => {
                    const active = [...document.querySelectorAll('audio')].find(
                        (audio) => !audio.paused,
                    );

                    return Boolean(
                        active &&
                        Number.isFinite(active.duration) &&
                        active.duration > 0 &&
                        active.readyState >= HTMLMediaElement.HAVE_METADATA,
                    );
                }),
            { timeout: 15_000 },
        )
        .toBe(true);

const seekActiveTrackNearEnd = async (page, secondsFromEnd = 0.15) => {
    await waitForActiveAudio(page);
    await page.evaluate((offset) => {
        const active = [...document.querySelectorAll('audio')].find((audio) => !audio.paused);
        if (!active || !Number.isFinite(active.duration)) {
            throw new Error('No active audio element is available');
        }
        active.currentTime = Math.max(0, active.duration - offset);
    }, secondsFromEnd);
};

const seekActiveTrackToStart = (page) =>
    page.evaluate(() => {
        const active = [...document.querySelectorAll('audio')].find((audio) => !audio.paused);
        if (!active) {
            throw new Error('No active audio element is available');
        }
        active.currentTime = 0;
    });

const enableRepeatAll = async (page) => {
    await page.getByRole('button', { name: 'Repeat disabled' }).click();
    await page.getByRole('button', { name: 'Repeat one' }).click();
    await expect(page.getByRole('button', { name: 'Repeat all' })).toBeVisible();
};

test('@nightly removes played and manually skipped tracks from the visible queue', async ({
    page,
}) => {
    await startQueue(page);
    await page.getByRole('button', { exact: true, name: 'Next' }).click();

    await expect
        .poll(() => queueNames(page))
        .toEqual([
            'Automation Track 2',
            'Automation Track 3',
            'Automation Track 4',
            'Automation Track 5',
            'Automation Track 6',
        ]);
    await expect(
        page.locator('.media-player').getByText('Automation Track 2', { exact: true }),
    ).toBeVisible();
});

test('@nightly previous restores the consumed track instead of wrapping to queue end', async ({
    page,
}) => {
    await startQueue(page);
    await enableRepeatAll(page);
    await page.getByRole('button', { exact: true, name: 'Next' }).click();
    await expect
        .poll(() => queueNames(page))
        .toEqual([
            'Automation Track 2',
            'Automation Track 3',
            'Automation Track 4',
            'Automation Track 5',
            'Automation Track 6',
        ]);

    await seekActiveTrackToStart(page);
    await page.getByRole('button', { exact: true, name: 'Previous' }).click();

    await expect
        .poll(() => queueNames(page))
        .toEqual([
            'Automation Track 1',
            'Automation Track 2',
            'Automation Track 3',
            'Automation Track 4',
            'Automation Track 5',
            'Automation Track 6',
        ]);
    await expect(
        page.locator('.media-player').getByText('Automation Track 1', { exact: true }),
    ).toBeVisible();
});

test('@nightly selecting a later track removes only the rows above it', async ({ page }) => {
    await startQueue(page);
    await selectQueueTrack(page, 'Automation Track 4');

    await expect
        .poll(() => queueNames(page))
        .toEqual(['Automation Track 4', 'Automation Track 5', 'Automation Track 6']);
});

test('@full exposes Play, Next, and Last directly on queue items', async ({ page }) => {
    await startQueue(page);
    await page
        .locator('#sidebar-queue')
        .getByText('Automation Track 2', { exact: true })
        .first()
        .click({ button: 'right' });

    const playAction = page.getByRole('menuitem', { exact: true, name: 'Play' }).first();
    const nextAction = page.getByRole('menuitem', { exact: true, name: 'Next' });
    const lastAction = page.getByRole('menuitem', { exact: true, name: 'Last' });
    await expect(playAction).toBeVisible();
    await expect(nextAction).toBeVisible();
    await expect(lastAction).toBeVisible();

    const playBox = await playAction.boundingBox();
    const nextBox = await nextAction.boundingBox();
    const lastBox = await lastAction.boundingBox();
    expect(playBox).not.toBeNull();
    expect(nextBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    expect(nextBox.y).toBeGreaterThan(playBox.y);
    expect(lastBox.y).toBeGreaterThan(nextBox.y);
});

test('@nightly shuffle anchors the current track at the top of the visible queue', async ({
    page,
}) => {
    await startQueue(page);
    await page.getByRole('button', { name: 'Shuffle disabled' }).click();

    await expect.poll(async () => (await queueNames(page))[0]).toBe('Automation Track 1');
    const names = await queueNames(page);
    expect(new Set(names)).toEqual(
        new Set([
            'Automation Track 1',
            'Automation Track 2',
            'Automation Track 3',
            'Automation Track 4',
            'Automation Track 5',
            'Automation Track 6',
        ]),
    );
});

test('@nightly repeat off stops after the final queue track', async ({ page }) => {
    await startQueue(page);
    await selectQueueTrack(page, 'Automation Track 6');
    await expect.poll(() => queueNames(page)).toEqual(['Automation Track 6']);

    await seekActiveTrackNearEnd(page);

    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => queueNames(page)).toEqual([]);
});

test('@nightly repeat all prepares the next cycle before the final track ends', async ({
    page,
}) => {
    await startQueue(page);
    await selectQueueTrack(page, 'Automation Track 6');
    await enableRepeatAll(page);

    await seekActiveTrackNearEnd(page, 4);

    await expect.poll(async () => (await queueNames(page)).length).toBeGreaterThan(1);
    await seekActiveTrackNearEnd(page);
    await expect
        .poll(() => page.locator('.media-player').innerText())
        .not.toContain('Automation Track 6');
});

test('@nightly shuffled repeat-all replenishes with a new visible order', async ({ page }) => {
    await startQueue(page);
    await page.getByRole('button', { name: 'Shuffle disabled' }).click();
    const firstCycle = await queueNames(page);
    await selectQueueTrack(page, firstCycle.at(-1));
    await enableRepeatAll(page);

    await seekActiveTrackNearEnd(page, 4);

    await expect.poll(async () => (await queueNames(page)).length).toBeGreaterThan(1);
    const nextCycle = await queueNames(page);
    expect(nextCycle[0]).toBe(firstCycle.at(-1));
    expect(new Set(nextCycle.slice(1))).toEqual(new Set(firstCycle));
});
