import { expect, test } from '@playwright/test';

test.describe('E6B computer drawer', () => {
	test('opens from the launcher and renders both faces', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));

		await page.goto('./drills');
		await page.locator('.fab').click();

		const root = page.locator('.e6b-root');
		await expect(root).toBeVisible();
		// Two instrument faces are built; the wind side shows first.
		await expect(root.locator('.e6b-face[data-face="back"] svg')).toBeVisible();

		// Switch to the front (slide-rule) side.
		await root.getByRole('button', { name: /przelicznik|slide rule/i }).click();
		await expect(root.locator('.e6b-face[data-face="front"]')).toHaveClass(/show/);
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

	test('lays the stage and panel side by side in landscape', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 600 });
		await page.goto('./drills/e6b');

		const stage = page.locator('.e6b-stage');
		const panel = page.locator('.e6b-panel');
		await expect(stage).toBeVisible();
		await expect(panel).toBeVisible();

		const stageBox = await stage.boundingBox();
		const panelBox = await panel.boundingBox();
		expect(stageBox).not.toBeNull();
		expect(panelBox).not.toBeNull();
		// Side by side: the panel starts to the right of the stage, not below it.
		expect(panelBox!.x).toBeGreaterThan(stageBox!.x + stageBox!.width - 5);
	});
});
