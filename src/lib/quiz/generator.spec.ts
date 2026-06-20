import { describe, expect, it } from 'vitest';
import type { QuizSet } from './schema';
import { buildQuestion, buildQuizDeck, isQuizAnswerCorrect, normalizeAnswer } from './generator';

const set: QuizSet = {
	schemaVersion: 1,
	id: 'demo',
	title: { pl: 'Demo' },
	labelA: { pl: 'Skrót', en: 'Abbreviation' },
	labelB: { pl: 'Rozwinięcie', en: 'Expansion' },
	directions: ['a-to-b', 'b-to-a'],
	pairs: [
		{
			id: 'tem',
			a: { pl: 'TEM' },
			b: { pl: 'Threat and Error Management' },
			acceptA: [],
			acceptB: ['TEM management']
		},
		{ id: 'gs', a: { pl: 'GS' }, b: { pl: 'Ground Speed' }, acceptA: [], acceptB: [] }
	]
};

describe('normalizeAnswer', () => {
	it('folds case, punctuation, diacritics and spacing', () => {
		expect(normalizeAnswer('  Ground-Speed.  ')).toBe('ground speed');
		expect(normalizeAnswer('Caférÿ')).toBe('cafery');
	});
});

describe('isQuizAnswerCorrect', () => {
	it('accepts the expected answer regardless of case and punctuation', () => {
		expect(isQuizAnswerCorrect('ground speed', 'Ground Speed')).toBe(true);
		expect(isQuizAnswerCorrect('GROUND-SPEED', 'Ground Speed')).toBe(true);
	});

	it('accepts any listed alternative spelling', () => {
		expect(isQuizAnswerCorrect('alpha', 'Alfa', ['Alpha'])).toBe(true);
	});

	it('rejects an empty answer (boundary)', () => {
		expect(isQuizAnswerCorrect('   ', 'Alfa')).toBe(false);
	});

	it('rejects a wrong answer (negative case)', () => {
		expect(isQuizAnswerCorrect('bravo', 'Alfa', ['Alpha'])).toBe(false);
	});
});

describe('buildQuestion', () => {
	it('quizzes the expansion when going a-to-b', () => {
		const q = buildQuestion(set, set.pairs[0], 'a-to-b', 'pl');
		expect(q.id).toBe('tem:a-to-b');
		expect(q.prompt).toBe('TEM');
		expect(q.expected).toBe('Threat and Error Management');
		expect(q.accept).toEqual(['TEM management']);
	});

	it('quizzes the abbreviation when going b-to-a', () => {
		const q = buildQuestion(set, set.pairs[0], 'b-to-a', 'pl');
		expect(q.id).toBe('tem:b-to-a');
		expect(q.prompt).toBe('Threat and Error Management');
		expect(q.expected).toBe('TEM');
	});
});

describe('buildQuizDeck', () => {
	it('produces one question per pair per requested direction', () => {
		const deck = buildQuizDeck(set, ['a-to-b', 'b-to-a'], 'pl', () => 0);
		expect(deck).toHaveLength(4);
		expect(new Set(deck.map((q) => q.id)).size).toBe(4);
	});

	it('restricts to a single direction when only one is requested', () => {
		const deck = buildQuizDeck(set, ['a-to-b'], 'pl', () => 0);
		expect(deck).toHaveLength(2);
		expect(deck.every((q) => q.id.endsWith('a-to-b'))).toBe(true);
	});

	it('falls back to the set directions when none of the requested ones are offered', () => {
		const oneWay: QuizSet = { ...set, directions: ['a-to-b'] };
		const deck = buildQuizDeck(oneWay, ['b-to-a'], 'pl', () => 0);
		expect(deck).toHaveLength(2);
		expect(deck.every((q) => q.id.endsWith('a-to-b'))).toBe(true);
	});
});
