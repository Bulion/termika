import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Mcq } from '$lib/content/schema';
import { choiceOrder } from '$lib/exam/exam';
import { setLocale } from '$lib/paraglide/runtime';
import McqQuestion from './McqQuestion.svelte';

const question: Mcq = {
	id: 'q1',
	type: 'mcq',
	microSkill: 'regulation',
	loIds: ['AIRLAW.1'],
	licenses: ['SPL'],
	tags: [],
	stem: { pl: 'Pytanie testowe?' },
	choices: [
		{ id: 'a', text: { pl: 'Alfa' } },
		{ id: 'b', text: { pl: 'Beta' } }
	],
	answer: 'a'
};

beforeEach(() => {
	setLocale('pl', { reload: false });
});

describe('McqQuestion', () => {
	it('renders the stem and choices', async () => {
		const screen = render(McqQuestion, { question, index: 1, locale: 'pl' });
		await expect.element(screen.getByText('Pytanie testowe?')).toBeVisible();
		await expect.element(screen.getByRole('radio', { name: 'Alfa' })).toBeVisible();
		await expect.element(screen.getByRole('radio', { name: 'Beta' })).toBeVisible();
	});

	it('checks the radio the learner selects', async () => {
		const screen = render(McqQuestion, { question, index: 1, locale: 'pl' });
		const beta = screen.getByRole('radio', { name: 'Beta' });
		await beta.click();
		await expect.element(beta).toBeChecked();
	});

	it('disables inputs once the answer is revealed', async () => {
		const screen = render(McqQuestion, {
			question,
			index: 1,
			locale: 'pl',
			selected: 'b',
			reveal: true
		});
		await expect.element(screen.getByRole('radio', { name: 'Alfa' })).toBeDisabled();
	});

	it('renders choices in the seeded shuffled order', async () => {
		const fourChoices: Mcq = {
			...question,
			choices: [
				{ id: 'a', text: { pl: 'Alfa' } },
				{ id: 'b', text: { pl: 'Beta' } },
				{ id: 'c', text: { pl: 'Gamma' } },
				{ id: 'd', text: { pl: 'Delta' } }
			]
		};
		const expected = choiceOrder(fourChoices, 7).map((c) => c.text.pl);
		const screen = render(McqQuestion, {
			question: fourChoices,
			index: 1,
			locale: 'pl',
			shuffleSeed: 7
		});
		const texts = [...screen.container.querySelectorAll('.choice-text')].map((el) =>
			el.textContent?.trim()
		);
		expect(texts).toEqual(expected);
	});
});
