import { expect, test } from '@playwright/test';

test('study session reveals an answer and accepts a grade', async ({ page }) => {
	await page.goto('./study');

	const reveal = page.getByRole('button', { name: /Pokaż odpowiedź|Show answer/ });
	await expect(reveal).toBeVisible();
	await reveal.click();

	const good = page.getByRole('button', { name: /Dobrze|Good/ });
	await expect(good).toBeVisible();
	await good.click();

	// After grading, either the next card's reveal button or the done message shows.
	await expect(
		page
			.getByRole('button', { name: /Pokaż odpowiedź|Show answer/ })
			.or(page.getByText(/Sesja ukończona|Session complete/))
	).toBeVisible();
});

test('can switch study mode to abbreviations', async ({ page }) => {
	await page.goto('./study');
	await page.getByRole('button', { name: /Skróty|Abbreviations/ }).click();
	await expect(page.getByRole('button', { name: /Skróty|Abbreviations/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});
