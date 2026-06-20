import { expect, test } from '@playwright/test';

test('theme toggle cycles to a dark theme', async ({ page }) => {
	await page.goto('./');
	const toggle = page.getByRole('button', { name: /Theme|Motyw/ });
	const html = page.locator('html');

	await toggle.click(); // system -> light
	await expect(html).not.toHaveAttribute('data-theme', 'dark');

	await toggle.click(); // light -> dark
	await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('language toggle switches the interface language', async ({ page }) => {
	await page.goto('./');
	const toggle = page.getByRole('button', { name: /Language|Język/ });
	const initial = (await toggle.textContent())?.trim();

	await toggle.click();
	const swapped = page.getByRole('button', { name: /Language|Język/ });
	await expect(swapped).not.toHaveText(initial ?? '');
});
