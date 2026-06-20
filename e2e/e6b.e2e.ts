import { expect, test } from '@playwright/test';

test.describe('E6B computer drawer', () => {
	test('opens from the launcher and renders both faces', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));

		await page.goto('./drills');
		await page.locator('.fab').click();

		const root = page.locator('.e6b-root');
		await expect(root).toBeVisible();
		// The instrument (wind side) shows first.
		await expect(root.locator('.e6b-stage')).toBeVisible();
		await expect(root.locator('.e6b-face[data-face="back"] svg')).toBeVisible();

		// Switch to the front (slide-rule) side.
		await root.getByRole('button', { name: /przelicznik|slide rule/i }).click();
		await expect(root.locator('.e6b-face[data-face="front"]')).toHaveClass(/show/);

		// On narrow screens the results live behind a toggle; switch to them.
		const resultsBtn = root.getByRole('button', { name: /^Wyniki$|^Results$/ });
		if (await resultsBtn.isVisible()) await resultsBtn.click();
		await expect(root.locator('.e6b-panel')).toBeVisible();

		expect(errors, errors.join('\n')).toEqual([]);
	});

	test('closes with the close button', async ({ page }) => {
		await page.goto('./drills');
		await page.locator('.fab').click();
		await expect(page.locator('.e6b-root')).toBeVisible();
		await page.getByRole('button', { name: /zamknij|close/i }).click();
		await expect(page.locator('.e6b-root')).toHaveCount(0);
	});

	test('shares the row with the questions as a fluid pane in a wide window', async ({ page }) => {
		await page.setViewportSize({ width: 1200, height: 700 });
		await page.goto('./drills/run?set=e6b-wind');
		await page.locator('.fab').click();

		const content = page.locator('.content-pane');
		const computer = page.locator('.computer-pane');
		await expect(computer).toBeVisible();

		const contentBox = await content.boundingBox();
		const computerBox = await computer.boundingBox();
		expect(contentBox).not.toBeNull();
		expect(computerBox).not.toBeNull();
		// Side by side: the computer begins where the content ends - not a fixed overlay.
		expect(computerBox!.x).toBeGreaterThan(contentBox!.x + contentBox!.width - 4);
		// Fluid: the computer takes roughly half of the 1200px window, not a fixed 440px.
		expect(computerBox!.width).toBeGreaterThan(520);
	});
});
