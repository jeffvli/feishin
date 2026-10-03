import { expect, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

const password = 'test-admin-password';
const replacementPassword = 'replacement-admin-password';

test.use({ serverLock: 'false' });

test('@full protects administrator controls and allows the password to be changed', async ({
    page,
}) => {
    await login(page);

    await navigateTo(page, '/settings');
    await expect(page.getByRole('dialog')).toContainText('Administrator access');
    await page.getByRole('textbox', { exact: true, name: 'Administrator password' }).fill(password);
    await page.getByLabel('Confirm administrator password').fill(password);
    await page.getByRole('button', { name: 'Set password and continue' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await navigateTo(page, '/');
    await page.locator('.media-player').dispatchEvent('dblclick', { button: 0 });
    const fullscreenControls = page.locator('.full-screen-player-controls-container').first();
    await expect(fullscreenControls).toBeVisible();
    await fullscreenControls.getByRole('button').nth(1).click();
    await expect(page.getByRole('dialog')).toContainText('Administrator access');
    await expect(page.getByText('Dynamic background')).toHaveCount(0);
    await page.getByRole('textbox', { exact: true, name: 'Administrator password' }).fill(password);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('Dynamic background')).toBeVisible();

    const searchInput = page.getByRole('textbox', { name: 'Search tracks or artists' });
    const searchBox = await searchInput.boundingBox();
    expect(searchBox).not.toBeNull();
    const searchIsTopLayer = await page.evaluate(
        ({ x, y }) =>
            document
                .elementFromPoint(x, y)
                ?.closest('input[aria-label="Search tracks or artists"]')
                ?.getAttribute('aria-label') === 'Search tracks or artists',
        {
            x: searchBox.x + searchBox.width / 2,
            y: searchBox.y + searchBox.height / 2,
        },
    );
    expect(searchIsTopLayer).toBe(false);
    await page.keyboard.press('Escape');

    await navigateTo(page, '/settings');
    await page
        .getByRole('textbox', { exact: true, name: 'Administrator password' })
        .fill('wrong-password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('The administrator password is incorrect.')).toBeVisible();
    await page.getByRole('textbox', { exact: true, name: 'Administrator password' }).fill(password);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.getByRole('button', { exact: true, name: 'Change password' }).click();
    await page
        .getByRole('textbox', { exact: true, name: 'Current administrator password' })
        .fill(password);
    await page
        .getByRole('textbox', { exact: true, name: 'New administrator password' })
        .fill(replacementPassword);
    await page
        .getByRole('textbox', { exact: true, name: 'Confirm new administrator password' })
        .fill(replacementPassword);
    await page
        .getByRole('dialog')
        .getByRole('button', { exact: true, name: 'Change password' })
        .click();
    await expect(page.getByText('Administrator password changed.')).toBeVisible();

    await navigateTo(page, '/');
    await page.getByRole('button', { exact: true, name: 'Menu' }).click();
    await page.getByRole('button', { exact: true, name: 'Manage servers' }).click();
    await page.getByRole('menuitem', { exact: true, name: 'Manage servers' }).click();
    await expect(page.getByRole('dialog')).toContainText('Administrator access');
    await page.getByRole('textbox', { exact: true, name: 'Administrator password' }).fill(password);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('The administrator password is incorrect.')).toBeVisible();
    await page
        .getByRole('textbox', { exact: true, name: 'Administrator password' })
        .fill(replacementPassword);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByRole('dialog')).toContainText('Manage servers');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    await navigateTo(page, '/library/albums');
    await page.getByRole('button', { name: 'Configure' }).click();
    await expect(page.getByRole('dialog')).toContainText('Administrator access');
    await page
        .getByRole('textbox', { exact: true, name: 'Administrator password' })
        .fill(replacementPassword);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('Grid rows')).toBeVisible();
});
