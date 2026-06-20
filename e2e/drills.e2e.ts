import { expect, test } from '@playwright/test';

test('drill runner checks an answer and advances', async ({ page }) => {
	await page.goto('./drills');

	const input = page.getByRole('textbox');
	await expect(input).toBeVisible();
	await input.fill('100');

	await page.getByRole('button', { name: /Sprawdź|Check/ }).click();
	await expect(page.getByRole('button', { name: /Następne|Next/ })).toBeVisible();

	await page.getByRole('button', { name: /Następne|Next/ }).click();
	await expect(page.getByRole('button', { name: /Sprawdź|Check/ })).toBeVisible();
});
