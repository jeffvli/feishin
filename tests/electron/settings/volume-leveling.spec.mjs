import { expect, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

const administratorPassword = 'volume-leveling-test-password';

const unlockSettingsIfNeeded = async (page) => {
    const dialog = page.getByRole('dialog', { name: 'Administrator access' });
    const heading = page.getByRole('heading', { name: 'Settings' });
    await expect(dialog.or(heading)).toBeVisible();
    if (await heading.isVisible()) return;

    await dialog
        .getByRole('textbox', { exact: true, name: 'Administrator password' })
        .fill(administratorPassword);

    const confirmation = dialog.getByRole('textbox', {
        exact: true,
        name: 'Confirm administrator password',
    });
    if (await confirmation.isVisible().catch(() => false)) {
        await confirmation.fill(administratorPassword);
        await dialog.getByRole('button', { name: 'Set password and continue' }).click();
        return;
    }

    await dialog.getByRole('button', { name: 'Unlock' }).click();
};

const openPlaybackSettings = async (page) => {
    await navigateTo(page, '/settings');
    await unlockSettingsIfNeeded(page);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('tab', { name: 'Playback' }).click();
};

const selectOption = async (page, combobox, option) => {
    await combobox.click();
    await page.getByRole('option', { exact: true, name: option }).click();
};

test('@full configures and restores automatic volume levelling', async ({ page }) => {
    await login(page);
    await openPlaybackSettings(page);

    const enabled = page.getByRole('switch', { name: 'Automatic volume levelling' });
    const profile = page.getByRole('combobox', { name: 'Volume levelling profile' });

    await expect(enabled).toBeChecked();
    await expect(profile).toHaveValue('Natural');

    await selectOption(page, profile, 'Tavern');
    await expect(profile).toHaveValue('Tavern');

    await page.reload();
    await openPlaybackSettings(page);
    await expect(profile).toHaveValue('Tavern');

    await enabled.uncheck({ force: true });
    await expect(profile).toHaveCount(0);

    await page.reload();
    await openPlaybackSettings(page);
    await expect(enabled).not.toBeChecked();
    await expect(profile).toHaveCount(0);

    await enabled.check({ force: true });
    await expect(profile).toHaveValue('Natural');
});

test('@full exposes volume levelling for Web and MPV playback', async ({ page }) => {
    await login(page);
    await openPlaybackSettings(page);

    const audioPlayer = page.getByRole('combobox', { name: 'Audio player' });
    const enabled = page.getByRole('switch', { name: 'Automatic volume levelling' });
    const profile = page.getByRole('combobox', { name: 'Volume levelling profile' });

    await expect(audioPlayer).toHaveValue('Web');
    await expect(enabled).toBeVisible();
    await expect(profile).toBeVisible();

    await selectOption(page, audioPlayer, 'MPV');
    await expect(audioPlayer).toHaveValue('MPV');
    await expect(enabled).toBeVisible();
    await expect(profile).toBeVisible();
});
