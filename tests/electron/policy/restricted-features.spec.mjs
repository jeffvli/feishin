import { expect, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

test('@full restricted product features are absent from navigation', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Radio Stations', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /create playlist/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /auto dj/i })).toHaveCount(0);

    await navigateTo(page, '/settings');
    const administratorDialog = page.getByRole('dialog', { name: 'Administrator access' });
    await expect(administratorDialog).toBeVisible();
    await administratorDialog
        .getByRole('textbox', { exact: true, name: 'Administrator password' })
        .fill('restricted-features-test-password');
    await administratorDialog
        .getByRole('textbox', { exact: true, name: 'Confirm administrator password' })
        .fill('restricted-features-test-password');
    await administratorDialog.getByRole('button', { name: 'Set password and continue' }).click();
    await page.getByRole('tab', { name: 'Playback' }).click();
    await expect(page.getByText('Auto DJ', { exact: true })).toHaveCount(0);
});
