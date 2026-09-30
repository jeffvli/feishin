import { expect, login, test } from '../fixtures/katiesamp-test.mjs';

test('@full restricted product features are absent from navigation', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Radio Stations', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /create playlist/i })).toHaveCount(0);
});
