import { describe, expect, it } from 'vitest';
import { generateMetar } from './generator';

describe('generateMetar', () => {
	it('is deterministic for the same seed', () => {
		expect(generateMetar(123)).toEqual(generateMetar(123));
	});

	it('produces different reports for different seeds', () => {
		expect(generateMetar(1).raw).not.toBe(generateMetar(2).raw);
	});

	it('builds a raw report that contains the context and every token', () => {
		const m = generateMetar(7);
		expect(m.raw.startsWith(m.context)).toBe(true);
		for (const token of m.tokens) {
			expect(m.raw).toContain(token.raw);
		}
		expect(m.tokens.length).toBeGreaterThanOrEqual(4);
	});

	it('gives each token options that include the correct answer and plausible distractors', () => {
		const m = generateMetar(99);
		for (const token of m.tokens) {
			expect(token.options.length).toBeGreaterThanOrEqual(3);
			expect(token.options[token.answerIndex]).toEqual(token.correct);
			const others = token.options.filter((_, i) => i !== token.answerIndex);
			for (const distractor of others) {
				expect(distractor.pl).not.toBe(token.correct.pl);
			}
			expect(token.options.every((o) => o.pl.length > 0 && o.en.length > 0)).toBe(true);
		}
	});
});
