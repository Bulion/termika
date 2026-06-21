import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Drill } from '$lib/drills/schema';
import { setLocale } from '$lib/paraglide/runtime';
import DrillRunner from './DrillRunner.svelte';

const rodDrill: Drill = {
	id: 'rod',
	microSkill: 'nav_rule',
	prompt: { pl: 'GS {value} kt → ROD?' },
	generate: { min: 70, max: 160, step: 10 },
	op: { kind: 'linear', factor: 5, offset: 0 },
	tolerancePct: 5,
	round: 0,
	tags: []
};

beforeEach(() => {
	setLocale('pl', { reload: false });
});

describe('DrillRunner', () => {
	it('shows a generated problem from the chosen value', async () => {
		const screen = render(DrillRunner, { drills: [rodDrill], locale: 'pl', pick: () => 0 });
		await expect.element(screen.getByText('GS 70 kt → ROD?')).toBeVisible();
	});

	it('accepts a correct answer and reports it', async () => {
		const onAttempt = vi.fn();
		const screen = render(DrillRunner, {
			drills: [rodDrill],
			locale: 'pl',
			pick: () => 0,
			now: () => 0,
			onAttempt
		});
		await screen.getByRole('textbox').fill('350');
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('Dobrze!')).toBeVisible();
		expect(onAttempt).toHaveBeenCalledWith(
			expect.objectContaining({ drillId: 'rod', correct: true })
		);
	});

	it('hides the rule while answering and reveals it only in feedback', async () => {
		const withRule: Drill = { ...rodDrill, rule: { pl: 'reguła GS przez 2 razy 10' } };
		const screen = render(DrillRunner, {
			drills: [withRule],
			locale: 'pl',
			pick: () => 0,
			now: () => 0,
			onAttempt: vi.fn()
		});
		expect(screen.container.querySelector('.rule')).toBeNull();
		await screen.getByRole('textbox').fill('350');
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('reguła GS przez 2 razy 10')).toBeVisible();
	});

	it('marks a wrong answer and reveals the correct value', async () => {
		const screen = render(DrillRunner, {
			drills: [rodDrill],
			locale: 'pl',
			pick: () => 0,
			now: () => 0,
			onAttempt: vi.fn()
		});
		await screen.getByRole('textbox').fill('999');
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('Poprawnie: 350')).toBeVisible();
	});
});
