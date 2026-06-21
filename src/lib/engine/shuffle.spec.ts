import { describe, expect, it } from 'vitest';
import { seededShuffle } from './shuffle';

describe('seededShuffle', () => {
	const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	it('is deterministic for the same seed', () => {
		expect(seededShuffle(input, 42)).toEqual(seededShuffle(input, 42));
	});

	it('produces a different order for a different seed', () => {
		expect(seededShuffle(input, 1)).not.toEqual(seededShuffle(input, 2));
	});

	it('preserves all elements and does not mutate the input', () => {
		const copy = [...input];
		const out = seededShuffle(input, 7);
		expect([...out].sort((a, b) => a - b)).toEqual(input);
		expect(input).toEqual(copy);
	});

	it('returns a real permutation (usually reorders)', () => {
		expect(seededShuffle(input, 12345)).not.toEqual(input);
	});
});
