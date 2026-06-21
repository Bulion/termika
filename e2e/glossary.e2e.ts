import { expect, test } from '@playwright/test';

test('study hub links to the searchable glossary', async ({ page }) => {
	await page.goto('./study');
	await page.getByRole('link', { name: /Glosariusz|Glossary/ }).click();
	await expect(page).toHaveURL(/\/study\/glossary/);
	await expect(page.getByRole('heading', { level: 1, name: /Glosariusz|Glossary/ })).toBeVisible();
});

test('glossary search filters entries by term and meaning', async ({ page }) => {
	await page.goto('./study/glossary');
	await expect(page.getByText('METAR', { exact: true }).first()).toBeVisible();

	const search = page.getByRole('searchbox');
	await search.fill('zzzzzz');
	await expect(page.getByText(/Brak wyników|No results/)).toBeVisible();

	await search.fill('metar');
	await expect(page.getByText('METAR', { exact: true }).first()).toBeVisible();
});
