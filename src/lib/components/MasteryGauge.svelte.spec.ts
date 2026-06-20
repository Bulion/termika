import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MasteryGauge from './MasteryGauge.svelte';

describe('MasteryGauge', () => {
	it('shows the readiness value and label', async () => {
		const screen = render(MasteryGauge, { pct: 50, label: 'Readiness' });
		await expect.element(screen.getByText('50%')).toBeVisible();
		await expect.element(screen.getByText('Readiness')).toBeVisible();
	});

	it('clamps values above 100 (boundary)', async () => {
		const screen = render(MasteryGauge, { pct: 150, label: 'Readiness' });
		await expect.element(screen.getByText('100%')).toBeVisible();
	});

	it('clamps negative values to 0 (boundary)', async () => {
		const screen = render(MasteryGauge, { pct: -10, label: 'Readiness' });
		await expect.element(screen.getByText('0%')).toBeVisible();
	});
});
