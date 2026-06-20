import { expect, test } from '@playwright/test';

test('home page renders the hero and tagline', async ({ page }) => {
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Termika');
	await expect(page.getByText(/zostaje w głowie|actually sticks/)).toBeVisible();
});

test('home page has no horizontal overflow on a narrow viewport', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 720 });
	await page.goto('./');
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);
	expect(overflow).toBe(false);
});
