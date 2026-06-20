import { describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import { createScheduler } from './scheduler';

const NOW = new Date('2026-01-01T12:00:00Z');

describe('createScheduler', () => {
	it('creates a new card that is due now and in the New state', () => {
		const scheduler = createScheduler();
		const card = scheduler.newCard(NOW);
		expect(card.due.getTime()).toBe(NOW.getTime());
		expect(card.state).toBe(State.New);
		expect(card.reps).toBe(0);
	});

	it('schedules a "good" review into the future and counts the rep', () => {
		const scheduler = createScheduler();
		const card = scheduler.newCard(NOW);
		const { card: next, log } = scheduler.review(card, 'good', NOW);
		expect(next.due.getTime()).toBeGreaterThan(NOW.getTime());
		expect(next.reps).toBe(1);
		expect(log.rating).toBe(3);
	});

	it('keeps "again" reviews close to now relative to "easy"', () => {
		const scheduler = createScheduler();
		const card = scheduler.newCard(NOW);
		const again = scheduler.review(card, 'again', NOW).card;
		const easy = scheduler.review(card, 'easy', NOW).card;
		expect(again.due.getTime()).toBeLessThan(easy.due.getTime());
	});

	it('rejects a desired retention outside the open interval (0, 1)', () => {
		expect(() => createScheduler({ requestRetention: 0 })).toThrow(RangeError);
		expect(() => createScheduler({ requestRetention: 1 })).toThrow(RangeError);
		expect(() => createScheduler({ requestRetention: 1.5 })).toThrow(RangeError);
	});

	it('accepts a desired retention at the edges of the valid range', () => {
		expect(() => createScheduler({ requestRetention: 0.99 })).not.toThrow();
		expect(() => createScheduler({ requestRetention: 0.7 })).not.toThrow();
	});
});
