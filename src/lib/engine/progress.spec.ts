import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TermikaDb } from './db';
import { dueItemIds, ensureCard, getCardState, recordReview } from './progress';
import { createScheduler } from './scheduler';

const NOW = new Date('2026-01-01T12:00:00Z');
const scheduler = createScheduler();

let db: TermikaDb;
let dbName = 0;

beforeEach(() => {
	db = new TermikaDb(`termika-test-${dbName++}`);
});

afterEach(async () => {
	await db.delete();
});

describe('ensureCard', () => {
	it('creates a card the first time and returns the same one afterwards', async () => {
		const first = await ensureCard(db, scheduler, 'item-1', NOW);
		expect(first.due.getTime()).toBe(NOW.getTime());
		const second = await ensureCard(db, scheduler, 'item-1', new Date('2026-02-01T00:00:00Z'));
		expect(second.due.getTime()).toBe(first.due.getTime());
		expect(await db.cardState.count()).toBe(1);
	});
});

describe('recordReview', () => {
	it('advances the schedule and appends exactly one review log', async () => {
		const row = await recordReview(db, scheduler, 'item-1', 'good', NOW, 4200);
		expect(row.due.getTime()).toBeGreaterThan(NOW.getTime());

		const stored = await getCardState(db, 'item-1');
		expect(stored?.due.getTime()).toBe(row.due.getTime());

		const logs = await db.reviewLogs.where('itemId').equals('item-1').toArray();
		expect(logs).toHaveLength(1);
		expect(logs[0].grade).toBe('good');
		expect(logs[0].elapsedMs).toBe(4200);
	});

	it('accumulates a log per review', async () => {
		await recordReview(db, scheduler, 'item-1', 'good', NOW);
		await recordReview(db, scheduler, 'item-1', 'again', new Date('2026-01-01T12:10:00Z'));
		expect(await db.reviewLogs.count()).toBe(2);
	});

	it('rejects a negative elapsed time instead of storing it', async () => {
		await expect(recordReview(db, scheduler, 'item-1', 'good', NOW, -1)).rejects.toBeInstanceOf(
			RangeError
		);
		expect(await db.reviewLogs.count()).toBe(0);
	});
});

describe('dueItemIds', () => {
	beforeEach(async () => {
		const mk = (itemId: string, dueIso: string) =>
			db.cardState.put({
				itemId,
				due: new Date(dueIso),
				state: 2,
				card: { due: new Date(dueIso) } as never
			});
		await mk('overdue-most', '2025-12-30T00:00:00Z');
		await mk('overdue-less', '2025-12-31T00:00:00Z');
		await mk('due-now', NOW.toISOString());
		await mk('future', '2026-02-01T00:00:00Z');
	});

	it('returns only items due at or before now, most overdue first', async () => {
		const ids = await dueItemIds(db, NOW);
		expect(ids).toEqual(['overdue-most', 'overdue-less', 'due-now']);
	});

	it('returns nothing when everything is scheduled in the future (boundary)', async () => {
		const ids = await dueItemIds(db, new Date('2025-01-01T00:00:00Z'));
		expect(ids).toEqual([]);
	});
});
