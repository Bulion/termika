import { expect, test } from '@playwright/test';

test('drills hub opens a set and the runner checks an answer', async ({ page }) => {
	await page.goto('./drills');
	await expect(
		page.getByRole('link', { name: /Przeliczenia jednostek|Unit conversions/ })
	).toBeVisible();

	await page.getByRole('link', { name: /Reguły nawigacyjne|Navigation rules/ }).click();
	await expect(page).toHaveURL(/\/drills\/run\?set=nav-rules/);

	const input = page.getByRole('textbox');
	await expect(input).toBeVisible();
	await input.fill('100');

	await page.getByRole('button', { name: /Sprawdź|Check/ }).click();
	await expect(page.getByRole('button', { name: /Następne|Next/ })).toBeVisible();

	await page.getByRole('button', { name: /Następne|Next/ }).click();
	await expect(page.getByRole('button', { name: /Sprawdź|Check/ })).toBeVisible();
});
