import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Flashcard } from '$lib/content/schema';
import { setLocale } from '$lib/paraglide/runtime';
import RecallCard from './RecallCard.svelte';

const item: Flashcard = {
	id: 'spl-met-cavok',
	type: 'flashcard',
	microSkill: 'abbreviation',
	loIds: ['MET.METAR'],
	licenses: ['SPL'],
	tags: [],
	confusableWith: [],
	front: { pl: 'CAVOK' },
	back: { pl: 'Ceiling and visibility OK' }
};

beforeEach(() => {
	setLocale('pl', { reload: false });
});

describe('RecallCard', () => {
	it('shows the prompt and a reveal button, with no grade buttons yet', async () => {
		const screen = render(RecallCard, { item, locale: 'pl', onGrade: vi.fn() });
		await expect.element(screen.getByText('CAVOK')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Pokaż odpowiedź' })).toBeVisible();
		expect(screen.container.querySelector('.grade')).toBeNull();
	});

	it('flips to reveal the answer and grade buttons on demand', async () => {
		const screen = render(RecallCard, { item, locale: 'pl', onGrade: vi.fn() });
		await screen.getByRole('button', { name: 'Pokaż odpowiedź' }).click();
		await expect.element(screen.getByText('Ceiling and visibility OK')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Dobrze' })).toBeVisible();
	});

	it('calls onGrade with the chosen grade', async () => {
		const onGrade = vi.fn();
		const screen = render(RecallCard, { item, locale: 'pl', onGrade });
		await screen.getByRole('button', { name: 'Pokaż odpowiedź' }).click();
		await screen.getByRole('button', { name: 'Dobrze' }).click();
		expect(onGrade).toHaveBeenCalledWith('good');
	});
});
