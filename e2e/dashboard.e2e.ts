import { expect, test } from '@playwright/test';

test('dashboard shows readiness and a working export control', async ({ page }) => {
	await page.goto('./dashboard');

	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByText(/Exam readiness|Gotowość do egzaminu/)).toBeVisible();

	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: /Export progress|Eksportuj postępy/ }).click();
	expect((await download).suggestedFilename()).toBe('termika-backup.json');
});
