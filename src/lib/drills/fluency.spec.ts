import { describe, expect, it } from 'vitest';
import {
	DEFAULT_FLUENCY_CONFIG,
	emptyFluency,
	median,
	updateFluency,
	type FluencyState
} from './fluency';

const fast = { correct: true, latencyMs: 2000 };

function applyMany(count: number, attempt = fast): FluencyState {
	let state = emptyFluency();
	for (let i = 0; i < count; i += 1) state = updateFluency(state, attempt);
	return state;
}

describe('median', () => {
	it('handles odd and even lengths', () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
	});

	it('returns 0 for an empty list (boundary)', () => {
		expect(median([])).toBe(0);
	});
});

describe('updateFluency', () => {
	it('counts attempts and correct answers', () => {
		const state = updateFluency(emptyFluency(), fast);
		expect(state.attempts).toBe(1);
		expect(state.correct).toBe(1);
	});

	it('graduates after enough fast, accurate attempts', () => {
		const state = applyMany(DEFAULT_FLUENCY_CONFIG.minAttempts);
		expect(state.graduated).toBe(true);
	});

	it('does not graduate before the minimum attempts (boundary)', () => {
		const state = applyMany(DEFAULT_FLUENCY_CONFIG.minAttempts - 1);
		expect(state.graduated).toBe(false);
	});

	it('does not graduate when answers are too slow', () => {
		const state = applyMany(DEFAULT_FLUENCY_CONFIG.minAttempts, {
			correct: true,
			latencyMs: DEFAULT_FLUENCY_CONFIG.maxMedianLatencyMs + 1000
		});
		expect(state.graduated).toBe(false);
	});

	it('does not graduate when accuracy is below target', () => {
		let state = emptyFluency();
		for (let i = 0; i < DEFAULT_FLUENCY_CONFIG.minAttempts; i += 1) {
			state = updateFluency(state, { correct: i % 2 === 0, latencyMs: 1000 });
		}
		expect(state.graduated).toBe(false);
	});

	it('keeps only the most recent window of results', () => {
		const state = applyMany(DEFAULT_FLUENCY_CONFIG.window + 5);
		expect(state.recentResults).toHaveLength(DEFAULT_FLUENCY_CONFIG.window);
		expect(state.attempts).toBe(DEFAULT_FLUENCY_CONFIG.window + 5);
	});

	it('rejects a negative latency (negative case)', () => {
		expect(() => updateFluency(emptyFluency(), { correct: true, latencyMs: -1 })).toThrow(
			RangeError
		);
	});
});
