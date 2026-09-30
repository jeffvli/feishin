import { expect, login, test } from '../fixtures/katiesamp-test.mjs';

test('@smoke launches with the configured Jellyfin sign-in form', async ({ electronApp, page }) => {
    expect(await electronApp.evaluate(({ app }) => app.getName())).toBe('KatiesAmp');
    await expect(page.getByLabel('Username')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('Server Name')).toHaveValue('KATIESMUSICSERVER');
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Add|Login)$/ })).toBeVisible();
});

test('@smoke logs in and displays the branded home screen', async ({ page }) => {
    await login(page);
    await expect(page.getByText("Katie O'Brien's Irish Taverns", { exact: true })).toBeVisible();
    await expect(page.getByText('Kev Laws', { exact: true })).toBeVisible();
    await expect(page.getByText('07969 765 597', { exact: true })).toBeVisible();
    await expect(
        page.getByText('k.laws@katieobriensirishtaverns.com', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Connected to KATIESMUSICSERVER', { exact: true })).toBeVisible();
    await expect(page.getByText('Admin', { exact: true })).toBeVisible();
});

test('@full rejects invalid credentials without leaving login', async ({ page }) => {
    await page.getByLabel('Username').fill('Admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password');
    await page.getByRole('button', { name: /^(Add|Login)$/ }).click();
    await expect(page.getByRole('button', { name: /^(Add|Login)$/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'KatiesAmp' })).toHaveCount(0);
});
