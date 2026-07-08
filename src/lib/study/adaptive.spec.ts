import { describe, expect, it } from 'vitest';
import type { Mcq } from '../content/schema';
import { mulberry32 } from '../engine/shuffle';
import {
	COOLDOWN_SIZE,
	gradeAttempt,
	pickNext,
	updateStat,
	weightFor,
	type McqStat
} from './adaptive';

function mcq(id: string): Mcq {
	return {
		id,
		type: 'mcq',
		microSkill: 'regulation',
		loIds: ['ulc'],
		licenses: ['SPL'],
		tags: [],
		stem: { pl: id },
		choices: [
			{ id: 'a', text: { pl: 'A' } },
			{ id: 'b', text: { pl: 'B' } }
		],
		answer: 'a'
	};
}

function stat(itemId: string, mastery: number): McqStat {
	return { itemId, attempts: 1, mastery, avgAnswerMs: 10_000, updatedAt: new Date(0) };
}

describe('gradeAttempt', () => {
	it('grades a wrong answer 0 regardless of speed', () => {
		expect(gradeAttempt({ correct: false, answerMs: 1000, nextMs: 1000 })).toBe(0);
	});

	it('grades a fast correct answer 1', () => {
		expect(gradeAttempt({ correct: true, answerMs: 10_000, nextMs: 10_000 })).toBe(1);
	});

	it('grades a slow correct answer 0.6 (floor)', () => {
		expect(gradeAttempt({ correct: true, answerMs: 90_000, nextMs: 10_000 })).toBe(0.6);
	});

	it('scales linearly between fast and slow', () => {
		expect(gradeAttempt({ correct: true, answerMs: 37_500, nextMs: 10_000 })).toBeCloseTo(0.8);
	});

	it('adds a bonus for a quick next click', () => {
		expect(gradeAttempt({ correct: true, answerMs: 90_000, nextMs: 2000 })).toBeCloseTo(0.7);
	});

	it('caps the grade at 1', () => {
		expect(gradeAttempt({ correct: true, answerMs: 5000, nextMs: 1000 })).toBe(1);
	});
});

describe('updateStat', () => {
	const now = new Date('2026-07-08T10:00:00Z');

	it('creates a first stat from the attempt grade', () => {
		const next = updateStat(
			undefined,
			'q1',
			{ correct: true, answerMs: 10_000, nextMs: 10_000 },
			now
		);
		expect(next).toEqual({
			itemId: 'q1',
			attempts: 1,
			mastery: 1,
			avgAnswerMs: 10_000,
			updatedAt: now
		});
	});

	it('moves mastery toward the grade with EMA alpha 0.3', () => {
		const prev = stat('q1', 0.5);
		const next = updateStat(prev, 'q1', { correct: false, answerMs: 10_000, nextMs: 10_000 }, now);
		expect(next.mastery).toBeCloseTo(0.35);
		expect(next.attempts).toBe(2);
	});

	it('keeps a running mean of answer time', () => {
		const prev = stat('q1', 0.5);
		const next = updateStat(prev, 'q1', { correct: true, answerMs: 20_000, nextMs: 10_000 }, now);
		expect(next.avgAnswerMs).toBe(15_000);
	});
});

describe('weightFor', () => {
	it('boosts unseen questions', () => {
		expect(weightFor(undefined)).toBe(1.5);
	});

	it('weights a mastered question at the floor', () => {
		expect(weightFor(stat('q1', 1))).toBe(0.25);
	});

	it('weights a struggling question 10x a mastered one', () => {
		expect(weightFor(stat('q1', 0))).toBe(2.5);
	});
});

describe('pickNext', () => {
	it('throws on an empty pool', () => {
		expect(() => pickNext([], new Map(), [])).toThrow(RangeError);
	});

	it('never picks a question from the cooldown window', () => {
		const pool = Array.from({ length: 20 }, (_, i) => mcq(`q${i}`));
		const recent = pool.slice(0, COOLDOWN_SIZE).map((q) => q.id);
		const rng = mulberry32(1);
		for (let i = 0; i < 200; i += 1) {
			expect(recent).not.toContain(pickNext(pool, new Map(), recent, rng).id);
		}
	});

	it('shrinks the cooldown so small pools stay playable', () => {
		const pool = [mcq('q1'), mcq('q2'), mcq('q3')];
		const picked = pickNext(pool, new Map(), ['q1', 'q2', 'q3'], () => 0);
		expect(picked.id).toBe('q1');
	});

	it('repeats the only question of a single-item pool', () => {
		expect(pickNext([mcq('q1')], new Map(), ['q1'], () => 0).id).toBe('q1');
	});

	it('draws by weight deterministically', () => {
		const pool = [mcq('mastered'), mcq('weak')];
		const stats = new Map([
			['mastered', stat('mastered', 1)],
			['weak', stat('weak', 0)]
		]);
		expect(pickNext(pool, stats, [], () => 0.05).id).toBe('mastered');
		expect(pickNext(pool, stats, [], () => 0.5).id).toBe('weak');
	});

	it('prefers weak questions statistically', () => {
		const pool = [mcq('mastered'), mcq('weak')];
		const stats = new Map([
			['mastered', stat('mastered', 1)],
			['weak', stat('weak', 0)]
		]);
		const rng = mulberry32(42);
		let weak = 0;
		for (let i = 0; i < 1000; i += 1) {
			if (pickNext(pool, stats, [], rng).id === 'weak') weak += 1;
		}
		expect(weak).toBeGreaterThan(800);
	});
});
