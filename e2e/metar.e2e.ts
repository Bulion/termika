import { expect, test } from '@playwright/test';

test('drills hub opens the METAR decoder and a full play-through shows a result', async ({
	page
}) => {
	await page.goto('./drills');
	await page.getByRole('link', { name: /Rozszyfruj METAR|Decode the METAR/ }).click();
	await expect(page).toHaveURL(/\/drills\/metar/);

	// A token is highlighted and options are offered.
	await expect(page.locator('.tok.current')).toBeVisible();

	// Answer every group by picking the first option each time.
	for (let i = 0; i < 8; i++) {
		const options = page.locator('.option');
		if ((await options.count()) === 0) break;
		await options.first().click();
	}

	await expect(page.locator('.result')).toBeVisible();
	await expect(page.getByRole('button', { name: /Nowy METAR|New METAR/ })).toBeVisible();
});
