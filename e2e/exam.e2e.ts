import { expect, test } from '@playwright/test';

test('exam: pick a subject, answer, submit and see a verdict', async ({ page }) => {
	await page.goto('./exam');

	await page.getByRole('button', { name: /Meteorolog/ }).click();

	const firstRadio = page.getByRole('radio').first();
	await expect(firstRadio).toBeVisible();
	await firstRadio.check();

	await page.getByRole('button', { name: /Zakończ|Finish/ }).click();

	await expect(page.getByText(/Wynik|Score/)).toBeVisible();
	await expect(page.getByRole('button', { name: /Spróbuj ponownie|Try again/ })).toBeVisible();
});
