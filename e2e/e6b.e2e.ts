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

	test('docks on the right and pushes the questions left in wide landscape', async ({ page }) => {
		await page.setViewportSize({ width: 1100, height: 660 });
		await page.goto('./drills/run?set=e6b-wind');
		await page.locator('.fab').click();

		const drawer = page.getByRole('dialog');
		await expect(drawer).toBeVisible();
		const drawerBox = await drawer.boundingBox();
		expect(drawerBox).not.toBeNull();
		// Anchored to the right edge, ~440px wide - not a centred modal.
		expect(drawerBox!.x + drawerBox!.width).toBeGreaterThan(1100 - 2);
		expect(drawerBox!.width).toBeLessThan(480);

		// The question content sits to the left of the docked computer, not under it.
		const mainBox = await page.locator('main').first().boundingBox();
		expect(mainBox).not.toBeNull();
		expect(mainBox!.x + mainBox!.width).toBeLessThanOrEqual(drawerBox!.x + 5);
	});
});
