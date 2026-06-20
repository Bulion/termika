import { describe, expect, it } from 'vitest';
import { buildQuizDeck, isQuizAnswerCorrect } from './generator';
import { loadQuizSets, QuizValidationError } from './index';

describe('loadQuizSets (bundled data)', () => {
	it('loads the bundled quiz sets with unique pair ids', () => {
		const sets = loadQuizSets();
		expect(sets.length).toBeGreaterThan(0);
		for (const set of sets) {
			const ids = set.pairs.map((p) => p.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('every bundled pair accepts its own expansion as a correct answer', () => {
		for (const set of loadQuizSets()) {
			for (const q of buildQuizDeck(set, set.directions, 'pl', () => 0)) {
				expect(isQuizAnswerCorrect(q.expected, q.expected, q.accept)).toBe(true);
			}
		}
	});

	it('throws on an invalid quiz set instead of dropping it', () => {
		const broken = {
			schemaVersion: 1,
			id: 'bad',
			title: { pl: 'X' },
			labelA: { pl: 'A' },
			labelB: { pl: 'B' },
			pairs: []
		};
		expect(() => loadQuizSets([broken])).toThrow(QuizValidationError);
	});
});
