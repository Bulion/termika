import { expect, test } from '@playwright/test';

test('study hub lists exercises and opens a session', async ({ page }) => {
	await page.goto('./study');
	await expect(page.getByRole('link', { name: /Skróty|Abbreviations/ })).toBeVisible();

	await page.getByRole('link', { name: /Wszystko|^All/ }).click();
	await expect(page).toHaveURL(/\/study\/session\?mode=all/);
	await expect(page.getByRole('button', { name: /Pokaż odpowiedź|Show answer/ })).toBeVisible();
});

test('study session reveals an answer and accepts a grade', async ({ page }) => {
	await page.goto('./study/session?mode=all');

	const reveal = page.getByRole('button', { name: /Pokaż odpowiedź|Show answer/ });
	await expect(reveal).toBeVisible();
	await reveal.click();

	const good = page.getByRole('button', { name: /Dobrze|Good/ });
	await expect(good).toBeVisible();
	await good.click();

	await expect(
		page
			.getByRole('button', { name: /Pokaż odpowiedź|Show answer/ })
			.or(page.getByText(/Sesja ukończona|Session complete/))
	).toBeVisible();
});
