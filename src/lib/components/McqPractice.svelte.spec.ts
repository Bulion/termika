import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Mcq } from '$lib/content/schema';
import { setLocale } from '$lib/paraglide/runtime';
import McqPractice from './McqPractice.svelte';

function mcq(id: string, stem: string): Mcq {
	return {
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['ulc'],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: stem },
		choices: [
			{ id: 'a', text: { pl: `Dobra ${id}` } },
			{ id: 'b', text: { pl: `Zła ${id}` } }
		],
		answer: 'a'
	};
}

const questions = [mcq('q1', 'Pytanie 1?'), mcq('q2', 'Pytanie 2?'), mcq('q3', 'Pytanie 3?')];

beforeEach(() => {
	setLocale('pl', { reload: false });
});

describe('McqPractice', () => {
	it('updates the session stats strip after a correct answer', async () => {
		const screen = render(McqPractice, { questions, locale: 'pl', pick: () => 0 });
		await screen.getByRole('radio', { name: 'Dobra q1' }).click();
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('Dobre: 1')).toBeVisible();
		await expect.element(screen.getByText('Złe: 0')).toBeVisible();
		await expect.element(screen.getByText('Skuteczność: 100%')).toBeVisible();
	});

	it('updates the session stats strip after a wrong answer', async () => {
		const screen = render(McqPractice, { questions, locale: 'pl', pick: () => 0 });
		await screen.getByRole('radio', { name: 'Zła q1' }).click();
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('Dobre: 0')).toBeVisible();
		await expect.element(screen.getByText('Złe: 1')).toBeVisible();
		await expect.element(screen.getByText('Skuteczność: 0%')).toBeVisible();
	});

	it('reports the attempt with timings when advancing', async () => {
		const attempts: { itemId: string; correct: boolean; answerMs: number; nextMs: number }[] = [];
		let clock = 0;
		const screen = render(McqPractice, {
			questions,
			locale: 'pl',
			pick: () => 0,
			now: () => (clock += 1000),
			onAttempt: (attempt) => attempts.push(attempt)
		});
		await screen.getByRole('radio', { name: 'Zła q1' }).click();
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await screen.getByRole('button', { name: 'Następne' }).click();
		expect(attempts).toEqual([{ itemId: 'q1', correct: false, answerMs: 1000, nextMs: 1000 }]);
	});

	it('runs past the pool size without finishing and never repeats back to back', async () => {
		const screen = render(McqPractice, { questions, locale: 'pl', pick: () => 0 });
		const seen: string[] = [];
		for (let i = 0; i < 5; i += 1) {
			const stem = screen.container.querySelector('legend')?.textContent ?? '';
			seen.push(stem);
			await screen.getByRole('radio', { name: /Dobra/ }).click();
			await screen.getByRole('button', { name: 'Sprawdź' }).click();
			await screen.getByRole('button', { name: 'Następne' }).click();
		}
		await expect.element(screen.getByRole('button', { name: 'Sprawdź' })).toBeVisible();
		for (let i = 1; i < seen.length; i += 1) {
			expect(seen[i]).not.toBe(seen[i - 1]);
		}
	});
});
