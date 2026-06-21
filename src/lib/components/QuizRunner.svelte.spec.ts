import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { QuizSet } from '$lib/quiz/schema';
import { setLocale } from '$lib/paraglide/runtime';
import QuizRunner from './QuizRunner.svelte';

const set: QuizSet = {
	schemaVersion: 1,
	id: 'asi',
	title: { pl: 'Test' },
	labelA: { pl: 'Pytanie', en: 'Question' },
	labelB: { pl: 'Odpowiedź', en: 'Answer' },
	directions: ['a-to-b'],
	pairs: [
		{
			id: 'asi-1',
			a: { pl: 'Co mierzy prędkościomierz?' },
			b: { pl: 'Prędkość przyrządowa (IAS)' },
			acceptA: [],
			acceptB: [],
			keywordsA: [],
			keywordsB: [['ias', 'przyrządow']]
		}
	]
};

beforeEach(() => {
	setLocale('pl', { reload: false });
});

describe('QuizRunner keyword matching', () => {
	it('accepts a keyword answer and always shows the model answer', async () => {
		const screen = render(QuizRunner, { set, locale: 'pl', pick: () => 0, now: () => 0 });
		await screen.getByRole('textbox').fill('IAS');
		await screen.getByRole('button', { name: 'Sprawdź' }).click();
		await expect.element(screen.getByText('Dobrze!')).toBeVisible();
		await expect.element(screen.getByText(/Prędkość przyrządowa \(IAS\)/)).toBeVisible();
	});
});
